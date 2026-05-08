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

async function upsert_permission() {
  const full_permission = [
    // configuration currency
    { resource: "configuration.currency", action: "view", description: "View currency" },
    { resource: "configuration.currency", action: "create", description: "Create currency" },
    { resource: "configuration.currency", action: "update", description: "Update currency" },
    { resource: "configuration.currency", action: "delete", description: "Delete currency" },

    // configuration exchange rate
    { resource: "configuration.exchange_rate", action: "view", description: "View exchange rate" },
    { resource: "configuration.exchange_rate", action: "create", description: "Create exchange rate" },
    { resource: "configuration.exchange_rate", action: "update", description: "Update exchange rate" },
    { resource: "configuration.exchange_rate", action: "delete", description: "Delete exchange rate" },

    // configuration delivery point
    { resource: "configuration.delivery_point", action: "view", description: "View delivery point" },
    { resource: "configuration.delivery_point", action: "create", description: "Create delivery point" },
    { resource: "configuration.delivery_point", action: "update", description: "Update delivery point" },
    { resource: "configuration.delivery_point", action: "delete", description: "Delete delivery point" },

    // configuration location
    { resource: "configuration.location", action: "view", description: "View location" },
    { resource: "configuration.location", action: "create", description: "Create location" },
    { resource: "configuration.location", action: "update", description: "Update location" },
    { resource: "configuration.location", action: "delete", description: "Delete location" },

    // configuration department
    { resource: "configuration.department", action: "view", description: "View department" },
    { resource: "configuration.department", action: "create", description: "Create department" },
    { resource: "configuration.department", action: "update", description: "Update department" },
    { resource: "configuration.department", action: "delete", description: "Delete department" },

    // configuration tax profile
    { resource: "configuration.tax_profile", action: "view", description: "View tax profile" },
    { resource: "configuration.tax_profile", action: "create", description: "Create tax profile" },
    { resource: "configuration.tax_profile", action: "update", description: "Update tax profile" },
    { resource: "configuration.tax_profile", action: "delete", description: "Delete tax profile" },

    // configuration extra cost
    { resource: "configuration.extra_cost", action: "view", description: "View extra cost" },
    { resource: "configuration.extra_cost", action: "create", description: "Create extra cost" },
    { resource: "configuration.extra_cost", action: "update", description: "Update extra cost" },
    { resource: "configuration.extra_cost", action: "delete", description: "Delete extra cost" },

    // configuration business type
    { resource: "configuration.business_type", action: "view", description: "View business type" },
    { resource: "configuration.business_type", action: "create", description: "Create business type" },
    { resource: "configuration.business_type", action: "update", description: "Update business type" },
    { resource: "configuration.business_type", action: "delete", description: "Delete business type" },

    // configuration adjustment type
    { resource: "configuration.adjustment_type", action: "view", description: "View adjustment type" },
    { resource: "configuration.adjustment_type", action: "create", description: "Create adjustment type" },
    { resource: "configuration.adjustment_type", action: "update", description: "Update adjustment type" },
    { resource: "configuration.adjustment_type", action: "delete", description: "Delete adjustment type" },

    // product management unit
    { resource: "product_management.unit", action: "view", description: "View unit" },
    { resource: "product_management.unit", action: "create", description: "Create unit" },
    { resource: "product_management.unit", action: "update", description: "Update unit" },
    { resource: "product_management.unit", action: "delete", description: "Delete unit" },

    // product management product
    { resource: "product_management.product", action: "view", description: "View product" },
    { resource: "product_management.product", action: "create", description: "Create product" },
    { resource: "product_management.product", action: "update", description: "Update product" },
    { resource: "product_management.product", action: "delete", description: "Delete product" },

    // product management category
    { resource: "product_management.category", action: "view", description: "View category" },
    { resource: "product_management.category", action: "create", description: "Create category" },
    { resource: "product_management.category", action: "update", description: "Update category" },
    { resource: "product_management.category", action: "delete", description: "Delete category" },

    // product management report
    { resource: "product_management.report", action: "view", description: "View report" },

    // vendor management vendor
    { resource: "vendor_management.vendor", action: "view", description: "View vendor" },
    { resource: "vendor_management.vendor", action: "create", description: "Create vendor" },
    { resource: "vendor_management.vendor", action: "update", description: "Update vendor" },
    { resource: "vendor_management.vendor", action: "delete", description: "Delete vendor" },

    // vendor management price list
    { resource: "vendor_management.price_list", action: "view", description: "View price list" },
    { resource: "vendor_management.price_list", action: "create", description: "Create price list" },
    { resource: "vendor_management.price_list", action: "update", description: "Update price list" },
    { resource: "vendor_management.price_list", action: "delete", description: "Delete price list" },

    // vendor management price comparison
    { resource: "vendor_management.price_comparison", action: "view", description: "View price comparison" },

    // procurement purchase request
    { resource: "procurement.purchase_request", action: "view", description: "View purchase request" },
    {
      resource: "procurement.purchase_request",
      action: "view_department",
      description: "View purchase request by department",
    },
    { resource: "procurement.purchase_request", action: "view_all", description: "View all purchase requests" },

    // procurement purchase request template
    {
      resource: "procurement.purchase_request_template",
      action: "view",
      description: "View purchase request template",
    },
    {
      resource: "procurement.purchase_request_template",
      action: "create",
      description: "Create purchase request template",
    },
    {
      resource: "procurement.purchase_request_template",
      action: "update",
      description: "Update purchase request template",
    },
    {
      resource: "procurement.purchase_request_template",
      action: "delete",
      description: "Delete purchase request template",
    },

    // procurement purchase order
    { resource: "procurement.purchase_order", action: "view", description: "View purchase order" },
    // { resource: 'procurement.purchase_order', action: 'create', description: 'Create purchase order' },
    // { resource: 'procurement.purchase_order', action: 'update', description: 'Update purchase order' },
    // { resource: 'procurement.purchase_order', action: 'delete', description: 'Delete purchase order' },

    // procurement goods received note
    { resource: "procurement.goods_received_note", action: "view", description: "View goods received note" },
    { resource: "procurement.goods_received_note", action: "create", description: "Create goods received note" },
    { resource: "procurement.goods_received_note", action: "update", description: "Update goods received note" },
    { resource: "procurement.goods_received_note", action: "delete", description: "Delete goods received note" },
    { resource: "procurement.goods_received_note", action: "commit", description: "Commit goods received note" },

    // procurement credit note
    { resource: "procurement.credit_note", action: "view", description: "View credit note" },
    { resource: "procurement.credit_note", action: "create", description: "Create credit note" },
    { resource: "procurement.credit_note", action: "update", description: "Update credit note" },
    { resource: "procurement.credit_note", action: "delete", description: "Delete credit note" },

    // procurement vendor comparison
    { resource: "procurement.vendor_comparison", action: "view", description: "View vendor comparison" },

    // inventory management store requisition
    { resource: "inventory_management.store_requisition", action: "view", description: "View store requisition" },
    {
      resource: "inventory_management.store_requisition",
      action: "view_department",
      description: "View store requisition by department",
    },
    {
      resource: "inventory_management.store_requisition",
      action: "view_all",
      description: "View all store requisitions",
    },

    // inventory management store requisition template
    {
      resource: "inventory_management.store_requisition_template",
      action: "view",
      description: "View store requisition template",
    },
    {
      resource: "inventory_management.store_requisition_template",
      action: "create",
      description: "Create store requisition template",
    },
    {
      resource: "inventory_management.store_requisition_template",
      action: "update",
      description: "Update store requisition template",
    },
    {
      resource: "inventory_management.store_requisition_template",
      action: "delete",
      description: "Delete store requisition template",
    },

    // inventory management stock in
    { resource: "inventory_management.stock_in", action: "view", description: "View stock in" },
    { resource: "inventory_management.stock_in", action: "create", description: "Create stock in" },
    { resource: "inventory_management.stock_in", action: "update", description: "Update stock in" },
    { resource: "inventory_management.stock_in", action: "delete", description: "Delete stock in" },

    // inventory management stock out
    { resource: "inventory_management.stock_out", action: "view", description: "View stock out" },
    { resource: "inventory_management.stock_out", action: "create", description: "Create stock out" },
    { resource: "inventory_management.stock_out", action: "update", description: "Update stock out" },
    { resource: "inventory_management.stock_out", action: "delete", description: "Delete stock out" },

    // inventory management physical count
    { resource: "inventory_management.physical_count", action: "view", description: "View physical count" },
    { resource: "inventory_management.physical_count", action: "create", description: "Create physical count" },
    { resource: "inventory_management.physical_count", action: "update", description: "Update physical count" },
    { resource: "inventory_management.physical_count", action: "delete", description: "Delete physical count" },

    // inventory management spot check
    { resource: "inventory_management.spot_check", action: "view", description: "View spot check" },
    { resource: "inventory_management.spot_check", action: "create", description: "Create spot check" },
    { resource: "inventory_management.spot_check", action: "update", description: "Update spot check" },
    { resource: "inventory_management.spot_check", action: "delete", description: "Delete spot check" },

    // inventory management period end
    { resource: "inventory_management.period_end", action: "view", description: "View period end" },
    { resource: "inventory_management.period_end", action: "execute", description: "Execute period end" },
  ];

  for (const permission of full_permission) {
    const existing = await prisma_platform.tb_permission.findFirst({
      where: {
        resource: permission.resource,
        action: permission.action,
        deleted_at: null,
      },
    });

    let permission_record;
    if (existing) {
      permission_record = await prisma_platform.tb_permission.update({
        where: { id: existing.id },
        data: {
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        },
      });
    } else {
      permission_record = await prisma_platform.tb_permission.create({
        data: {
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        },
      });
    }

    console.log("Upserted permission:", permission_record);
  }

  return full_permission;
}

async function main() {
  // Add your seed data here
  console.log("Seeding database...");

  const full_permission = await upsert_permission();
  console.log("permission list:", full_permission);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma_platform.$disconnect();
  });
