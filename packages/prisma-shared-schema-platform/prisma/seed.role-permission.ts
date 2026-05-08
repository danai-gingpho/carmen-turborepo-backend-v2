import { PrismaClient } from "@repo/prisma-shared-schema-platform";
import * as dotenv from "dotenv";

dotenv.config();

const prisma_platform = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SYSTEM_DIRECT_URL,
    },
  },
});

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

async function seedRolePermissions(buId: string) {
  // Load all permissions into a lookup map: "resource:action" -> permission record
  const allPermissions = await prisma_platform.tb_permission.findMany({
    where: { deleted_at: null },
  });

  const permissionMap = new Map<string, { id: string }>();
  for (const perm of allPermissions) {
    permissionMap.set(`${perm.resource}:${perm.action}`, { id: perm.id });
  }

  console.log(`Loaded ${permissionMap.size} permissions from database`);

  // Find the specified business unit
  const bu = await prisma_platform.tb_business_unit.findFirst({
    where: { id: buId, deleted_at: null },
    select: { id: true, code: true, name: true },
  });

  if (!bu) {
    console.error(`Business unit not found: ${buId}`);
    process.exit(1);
  }

  console.log(`Target business unit: ${bu.code} (${bu.name})`);

  let totalRolesCreated = 0;
  let totalRolesUpdated = 0;
  let totalLinksCreated = 0;
  let totalLinksSkipped = 0;
  let totalPermissionsNotFound = 0;

  {
    console.log(`\n--- Processing business unit: ${bu.code} (${bu.name}) ---`);

    for (const [roleName, resources] of Object.entries(rolePermissions)) {
      // Upsert the role
      const existingRole = await prisma_platform.tb_application_role.findFirst({
        where: {
          business_unit_id: bu.id,
          name: roleName,
          deleted_at: null,
        },
      });

      let role;
      if (existingRole) {
        role = await prisma_platform.tb_application_role.update({
          where: { id: existingRole.id },
          data: {
            description: `${roleName} role`,
            is_active: true,
          },
        });
        totalRolesUpdated++;
        console.log(`  Updated role: ${roleName}`);
      } else {
        role = await prisma_platform.tb_application_role.create({
          data: {
            business_unit_id: bu.id,
            name: roleName,
            description: `${roleName} role`,
            is_active: true,
          },
        });
        totalRolesCreated++;
        console.log(`  Created role: ${roleName}`);
      }

      // Link permissions to the role
      for (const [resource, actions] of Object.entries(resources)) {
        for (const action of actions) {
          const permKey = `${resource}:${action}`;
          const permission = permissionMap.get(permKey);

          if (!permission) {
            console.warn(`    Permission not found: ${permKey} (run db:seed.permission first)`);
            totalPermissionsNotFound++;
            continue;
          }

          // Check if link already exists
          const existingLink = await prisma_platform.tb_application_role_tb_permission.findFirst({
            where: {
              application_role_id: role.id,
              permission_id: permission.id,
              deleted_at: null,
            },
          });

          if (existingLink) {
            totalLinksSkipped++;
            continue;
          }

          await prisma_platform.tb_application_role_tb_permission.create({
            data: {
              application_role_id: role.id,
              permission_id: permission.id,
              is_active: true,
            },
          });
          totalLinksCreated++;
        }
      }

      // Count linked permissions for this role
      const linkCount = await prisma_platform.tb_application_role_tb_permission.count({
        where: {
          application_role_id: role.id,
          deleted_at: null,
          is_active: true,
        },
      });
      console.log(`    ${roleName} -> ${linkCount} permissions linked`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Business unit: ${bu.code} (${bu.name})`);
  console.log(`Roles created: ${totalRolesCreated}`);
  console.log(`Roles updated: ${totalRolesUpdated}`);
  console.log(`Permission links created: ${totalLinksCreated}`);
  console.log(`Permission links skipped (already exist): ${totalLinksSkipped}`);
  if (totalPermissionsNotFound > 0) {
    console.warn(`Permissions not found: ${totalPermissionsNotFound} (run db:seed.permission first)`);
  }
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const buId = args[0];

  if (!buId) {
    console.error("Usage: bun run db:seed.role-permission <bu_id>");
    console.error("Example: bun run db:seed.role-permission 550e8400-e29b-41d4-a716-446655440000");
    process.exit(1);
  }

  console.log(`Seeding role permissions for business unit: ${buId}`);
  await seedRolePermissions(buId);
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma_platform.$disconnect();
  });
