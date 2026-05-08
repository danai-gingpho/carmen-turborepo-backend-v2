/**
 * build-permission-map.ts
 *
 * Regeneration script: inverts the role-permission seed literal into a flat
 * "resource:action" → [role names] map and writes permission-role-map.json.
 * Idempotent — re-running with no seed change produces zero diff.
 *
 * Run:  bun run swagger-bruno-refresh:build-map
 *
 * No database connection required — works purely off the static literal below,
 * which is copied from packages/prisma-shared-schema-platform/prisma/seed.role-permission.ts.
 * If that seed file changes, copy the updated literal here and re-run the script.
 */

import { writeFileSync } from "fs";
import { join } from "path";

/** Copied verbatim from seed.role-permission.ts — update both when the seed changes. */
const rolePermissions: Record<string, Record<string, string[]>> = {
  Requestor: {
    "configuration.currency": ["view"],
    "configuration.exchange_rate": ["view"],
    "configuration.delivery_point": ["view"],
    "configuration.location": ["view"],
    "configuration.department": ["view"],
    "configuration.tax_profile": ["view"],
    "configuration.extra_cost": ["view"],
    "configuration.business_type": ["view"],
    "configuration.adjustment_type": ["view"],
    "product_management.unit": ["view"],
    "product_management.product": ["view"],
    "product_management.category": ["view"],
    "product_management.report": [],
    "vendor_management.vendor": ["view"],
    "vendor_management.price_list": ["view"],
    "vendor_management.price_comparison": [],
    "procurement.purchase_request": ["view"],
    "procurement.purchase_request_template": ["view", "create", "update", "delete"],
    "procurement.purchase_order": ["view"],
    "procurement.goods_received_note": [],
    "procurement.credit_note": [],
    "procurement.vendor_comparison": [],
    "inventory_management.store_requisition": ["view"],
    "inventory_management.store_requisition_template": ["view", "create", "update", "delete"],
    "inventory_management.stock_in": [],
    "inventory_management.stock_out": [],
    "inventory_management.physical_count": [],
    "inventory_management.spot_check": [],
    "inventory_management.period_end": [],
  },
  HOD: {
    "configuration.currency": ["view"],
    "configuration.exchange_rate": ["view"],
    "configuration.delivery_point": ["view"],
    "configuration.location": ["view"],
    "configuration.department": ["view"],
    "configuration.tax_profile": ["view"],
    "configuration.extra_cost": ["view"],
    "configuration.business_type": ["view"],
    "configuration.adjustment_type": ["view"],
    "product_management.unit": ["view"],
    "product_management.product": ["view"],
    "product_management.category": ["view"],
    "product_management.report": ["view"],
    "vendor_management.vendor": ["view"],
    "vendor_management.price_list": ["view"],
    "vendor_management.price_comparison": ["view"],
    "procurement.purchase_request": ["view", "view_department"],
    "procurement.purchase_request_template": ["view", "create", "update", "delete"],
    "procurement.purchase_order": ["view"],
    "procurement.goods_received_note": ["view"],
    "procurement.credit_note": ["view"],
    "procurement.vendor_comparison": ["view"],
    "inventory_management.store_requisition": ["view", "view_department"],
    "inventory_management.store_requisition_template": ["view", "create", "update", "delete"],
    "inventory_management.stock_in": ["view"],
    "inventory_management.stock_out": ["view"],
    "inventory_management.physical_count": ["view"],
    "inventory_management.spot_check": ["view"],
    "inventory_management.period_end": ["view"],
  },
  Purchase: {
    "configuration.currency": ["view"],
    "configuration.exchange_rate": ["view"],
    "configuration.delivery_point": ["view", "create", "update", "delete"],
    "configuration.location": ["view", "create", "update", "delete"],
    "configuration.department": ["view"],
    "configuration.tax_profile": ["view"],
    "configuration.extra_cost": ["view", "create", "update", "delete"],
    "configuration.business_type": ["view"],
    "configuration.adjustment_type": ["view"],
    "product_management.unit": ["view", "create", "update", "delete"],
    "product_management.product": ["view", "create", "update", "delete"],
    "product_management.category": ["view", "create", "update", "delete"],
    "product_management.report": ["view"],
    "vendor_management.vendor": ["view", "create", "update", "delete"],
    "vendor_management.price_list": ["view", "create", "update", "delete"],
    "vendor_management.price_comparison": ["view"],
    "procurement.purchase_request": ["view", "view_all"],
    "procurement.purchase_request_template": ["view", "create", "update", "delete"],
    "procurement.purchase_order": ["view"],
    "procurement.goods_received_note": ["view", "create", "update", "delete", "commit"],
    "procurement.credit_note": ["view", "create", "update", "delete"],
    "procurement.vendor_comparison": ["view"],
    "inventory_management.store_requisition": ["view", "view_all"],
    "inventory_management.store_requisition_template": ["view", "create", "update", "delete"],
    "inventory_management.stock_in": ["view", "create", "update", "delete"],
    "inventory_management.stock_out": ["view", "create", "update", "delete"],
    "inventory_management.physical_count": ["view", "create", "update", "delete"],
    "inventory_management.spot_check": ["view", "create", "update", "delete"],
    "inventory_management.period_end": ["view", "execute"],
  },
  Approval: {
    "configuration.currency": ["view"],
    "configuration.exchange_rate": ["view"],
    "configuration.delivery_point": ["view"],
    "configuration.location": ["view"],
    "configuration.department": ["view"],
    "configuration.tax_profile": ["view"],
    "configuration.extra_cost": ["view"],
    "configuration.business_type": ["view"],
    "configuration.adjustment_type": ["view"],
    "product_management.unit": ["view"],
    "product_management.product": ["view"],
    "product_management.category": ["view"],
    "product_management.report": ["view"],
    "vendor_management.vendor": ["view"],
    "vendor_management.price_list": ["view"],
    "vendor_management.price_comparison": ["view"],
    "procurement.purchase_request": ["view", "view_all"],
    "procurement.purchase_request_template": ["view"],
    "procurement.purchase_order": ["view"],
    "procurement.goods_received_note": ["view"],
    "procurement.credit_note": ["view"],
    "procurement.vendor_comparison": ["view"],
    "inventory_management.store_requisition": ["view", "view_all"],
    "inventory_management.store_requisition_template": ["view"],
    "inventory_management.stock_in": ["view"],
    "inventory_management.stock_out": ["view"],
    "inventory_management.physical_count": ["view"],
    "inventory_management.spot_check": ["view"],
    "inventory_management.period_end": ["view"],
  },
};

/** Invert rolePermissions into { "resource:action": [roleName, ...] } */
function buildPermissionRoleMap(
  input: Record<string, Record<string, string[]>>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [roleName, resources] of Object.entries(input)) {
    for (const [resource, actions] of Object.entries(resources)) {
      for (const action of actions) {
        const key = `${resource}:${action}`;
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(roleName);
      }
    }
  }
  return result;
}

const permissionRoleMap = buildPermissionRoleMap(rolePermissions);

// Sort keys for stability
const sorted = Object.fromEntries(
  Object.entries(permissionRoleMap).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
);

const outputPath = join(import.meta.dir, "permission-role-map.json");
writeFileSync(outputPath, JSON.stringify(sorted, null, 2) + "\n");

const keyCount = Object.keys(sorted).length;
console.log(`Written ${keyCount} keys to ${outputPath}`);
