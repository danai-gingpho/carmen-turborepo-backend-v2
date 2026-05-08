#!/bin/bash
# migrate-tenants.sh — Run prisma migrate deploy for all tenant schemas
#
# Reads schema names from tb_business_unit.db_connection->'schema' in platform DB,
# then runs `prisma migrate deploy` for each unique schema.
#
# Usage:
#   ./scripts/migrate-tenants.sh                  # Migrate all tenant schemas
#   ./scripts/migrate-tenants.sh --dry-run        # Show schemas without migrating
#   ./scripts/migrate-tenants.sh CARMEN_TENANT_1  # Migrate specific schema only

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TENANT_PRISMA_DIR="$ROOT_DIR/packages/prisma-shared-schema-tenant"
PLATFORM_ENV="$ROOT_DIR/packages/prisma-shared-schema-platform/.env"

DRY_RUN=false
SPECIFIC_SCHEMA=""

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *)         SPECIFIC_SCHEMA="$arg" ;;
  esac
done

# ─────────────────────────────────────────────────
# 1. Read platform DB connection from .env
# ─────────────────────────────────────────────────

if [ ! -f "$PLATFORM_ENV" ]; then
  echo "ERROR: Platform .env not found at $PLATFORM_ENV"
  exit 1
fi

# Extract SYSTEM_DATABASE_URL (resolve SYSTEM_SCHEMA_NAME if needed)
SYSTEM_SCHEMA_NAME=$(grep -E '^SYSTEM_SCHEMA_NAME=' "$PLATFORM_ENV" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
SYSTEM_DATABASE_URL=$(grep -E '^SYSTEM_DATABASE_URL=' "$PLATFORM_ENV" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
SYSTEM_DATABASE_URL="${SYSTEM_DATABASE_URL//\$\{SYSTEM_SCHEMA_NAME\}/$SYSTEM_SCHEMA_NAME}"

if [ -z "$SYSTEM_DATABASE_URL" ]; then
  echo "ERROR: SYSTEM_DATABASE_URL not found in $PLATFORM_ENV"
  exit 1
fi

echo "=== Carmen Tenant Migration ==="
echo ""
echo "Platform DB: ${SYSTEM_DATABASE_URL%%\?*}?schema=$SYSTEM_SCHEMA_NAME"
echo ""

# ─────────────────────────────────────────────────
# 2. Query unique tenant schemas from tb_business_unit
#    Uses node + @repo/prisma-shared-schema-platform (no psql needed)
# ─────────────────────────────────────────────────

echo "--- Querying tenant schemas from \"$SYSTEM_SCHEMA_NAME\".tb_business_unit ---"
echo ""

SCHEMAS=$(SYSTEM_DATABASE_URL="$SYSTEM_DATABASE_URL" node -e "
const { PrismaClient } = require('$ROOT_DIR/packages/prisma-shared-schema-platform/generated/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.SYSTEM_DATABASE_URL } } });
(async () => {
  try {
    const rows = await prisma.tb_business_unit.findMany({
      where: { deleted_at: null, db_connection: { not: null } },
      select: { db_connection: true },
      distinct: ['db_connection'],
    });
    const schemas = [...new Set(
      rows.map(r => r.db_connection?.schema).filter(Boolean)
    )].sort();
    console.log(schemas.join('\n'));
  } catch (e) {
    console.error('ERROR: ' + e.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
" 2>&1)

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to query schemas"
  echo "$SCHEMAS"
  exit 1
fi

if [ -z "$SCHEMAS" ]; then
  echo "No tenant schemas found."
  exit 0
fi

# Filter specific schema if provided
if [ -n "$SPECIFIC_SCHEMA" ]; then
  if echo "$SCHEMAS" | grep -qx "$SPECIFIC_SCHEMA"; then
    SCHEMAS="$SPECIFIC_SCHEMA"
  else
    echo "ERROR: Schema '$SPECIFIC_SCHEMA' not found in tb_business_unit"
    echo ""
    echo "Available schemas:"
    echo "$SCHEMAS" | sed 's/^/  - /'
    exit 1
  fi
fi

SCHEMA_COUNT=$(echo "$SCHEMAS" | wc -l | tr -d ' ')
echo "Found $SCHEMA_COUNT unique tenant schema(s):"
echo "$SCHEMAS" | sed 's/^/  - /'
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] No migrations executed."
  exit 0
fi

# ─────────────────────────────────────────────────
# 3. Read tenant DB base URL from tenant .env
# ─────────────────────────────────────────────────

TENANT_ENV="$TENANT_PRISMA_DIR/.env"

if [ ! -f "$TENANT_ENV" ]; then
  echo "ERROR: Tenant .env not found at $TENANT_ENV"
  exit 1
fi

TENANT_BASE_URL=$(grep -E '^DATABASE_URL=' "$TENANT_ENV" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$TENANT_BASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in $TENANT_ENV"
  exit 1
fi

# ─────────────────────────────────────────────────
# 4. Run prisma migrate deploy for each schema
# ─────────────────────────────────────────────────

echo "=== Running migrations ==="
echo ""

SUCCESS=0
FAILED=0
FAILED_LIST=""

for SCHEMA in $SCHEMAS; do
  echo "--- [$SCHEMA] ---"

  # Replace schema in DATABASE_URL
  # Handle both ${SCHEMA_NAME} placeholder and hardcoded schema=XXX
  MIGRATE_URL="${TENANT_BASE_URL//\$\{SCHEMA_NAME\}/$SCHEMA}"
  # Also handle case where schema is already set to a value
  MIGRATE_URL=$(echo "$MIGRATE_URL" | sed "s/schema=[^&]*/schema=$SCHEMA/")

  cd "$TENANT_PRISMA_DIR"
  if DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy 2>&1; then
    echo "  ✓ $SCHEMA migrated successfully"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ $SCHEMA migration FAILED"
    FAILED=$((FAILED + 1))
    FAILED_LIST="$FAILED_LIST $SCHEMA"
  fi
  echo ""
done

# ─────────────────────────────────────────────────
# 5. Summary
# ─────────────────────────────────────────────────

echo "=== Migration Summary ==="
echo "  Total:   $SCHEMA_COUNT"
echo "  Success: $SUCCESS"
echo "  Failed:  $FAILED"

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "  Failed schemas:$FAILED_LIST"
  exit 1
fi

echo ""
echo "=== All migrations completed successfully ==="
