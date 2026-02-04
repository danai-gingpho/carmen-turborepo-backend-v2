#!/bin/bash
# Fix Prisma OpenSSL detection for Amazon Linux 2023 and Ubuntu 25.10+
# This script configures Prisma to use the library engine with OpenSSL 3.0.x

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Prisma OpenSSL Fix Script ===${NC}"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$NAME
    OS_VERSION=$VERSION_ID
else
    OS_NAME="Unknown"
    OS_VERSION="Unknown"
fi

echo -e "${YELLOW}Detected OS: ${OS_NAME} ${OS_VERSION}${NC}"

# Detect OpenSSL version
OPENSSL_VERSION=$(openssl version 2>/dev/null || echo "Not found")
echo -e "${YELLOW}OpenSSL version: ${OPENSSL_VERSION}${NC}"

# Determine the correct binary target
# Amazon Linux 2023 and RHEL-based systems use rhel-openssl-3.0.x
# Debian/Ubuntu use debian-openssl-3.0.x
if [[ "$OS_NAME" == *"Amazon"* ]] || [[ "$OS_NAME" == *"Red Hat"* ]] || [[ "$OS_NAME" == *"CentOS"* ]] || [[ "$OS_NAME" == *"Fedora"* ]]; then
    BINARY_TARGET="rhel-openssl-3.0.x"
else
    BINARY_TARGET="debian-openssl-3.0.x"
fi

echo -e "${YELLOW}Using binary target: ${BINARY_TARGET}${NC}"

# Environment variables to set
ENV_VARS="# Prisma OpenSSL fix for ${OS_NAME}
PRISMA_CLIENT_ENGINE_TYPE=library"

# Function to add env vars to a file
add_env_to_file() {
    local file=$1
    if [ -f "$file" ]; then
        if grep -q "PRISMA_CLIENT_ENGINE_TYPE" "$file"; then
            echo -e "${YELLOW}PRISMA_CLIENT_ENGINE_TYPE already set in $file${NC}"
        else
            echo -e "${GREEN}Adding Prisma env vars to $file${NC}"
            # Add to beginning of file
            echo -e "${ENV_VARS}\n$(cat $file)" > "$file"
        fi
    else
        echo -e "${YELLOW}File not found: $file${NC}"
    fi
}

# Find and update all .env files in packages with Prisma
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "\n${GREEN}Updating .env files...${NC}"

# Update Prisma package env files
for env_file in "$PROJECT_ROOT"/packages/prisma-*/.env; do
    if [ -f "$env_file" ]; then
        add_env_to_file "$env_file"
    fi
done

# Update app env files
for env_file in "$PROJECT_ROOT"/apps/*/.env; do
    if [ -f "$env_file" ]; then
        add_env_to_file "$env_file"
    fi
done

# Export for current session
export PRISMA_CLIENT_ENGINE_TYPE=library

echo -e "\n${GREEN}Verifying Prisma configuration...${NC}"
cd "$PROJECT_ROOT"

# Check if prisma is available
if command -v npx &> /dev/null; then
    echo -e "${YELLOW}Running prisma version...${NC}"
    npx prisma version 2>&1 | grep -E "(binaryTarget|Engine|Operating)" || true
fi

echo -e "\n${GREEN}=== Fix Complete ===${NC}"
echo -e "Environment variable set: ${YELLOW}PRISMA_CLIENT_ENGINE_TYPE=library${NC}"
echo -e "\nTo apply in current shell, run:"
echo -e "  ${YELLOW}export PRISMA_CLIENT_ENGINE_TYPE=library${NC}"
echo -e "\nFor Docker/Amazon Linux 2023, add to Dockerfile:"
echo -e "  ${YELLOW}ENV PRISMA_CLIENT_ENGINE_TYPE=library${NC}"
echo -e "\nBinary target for schema.prisma:"
echo -e "  ${YELLOW}binaryTargets = [\"native\", \"${BINARY_TARGET}\"]${NC}"
