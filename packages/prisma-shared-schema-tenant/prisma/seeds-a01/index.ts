// Auto-generated index of seed scripts
// Run individual seeds: npx ts-node prisma/seeds-a01/seed-<table-name>.ts

export const availableSeeds = [
  "tb_application_config",
  "tb_config_running_code",
  "tb_credit_term",
  "tb_currency",
  "tb_delivery_point",
  "tb_department",
  "tb_department_user",
  "tb_extra_cost_type",
  "tb_location",
  "tb_product",
  "tb_product_category",
  "tb_product_item_group",
  "tb_product_location",
  "tb_product_sub_category",
  "tb_purchase_request",
  "tb_purchase_request_detail",
  "tb_unit",
  "tb_unit_conversion",
  "tb_user_location",
  "tb_user_profile",
  "tb_vendor",
  "tb_vendor_address",
  "tb_vendor_business_type",
  "tb_vendor_contact",
  "tb_workflow",
];

console.log("Available seed scripts:");
availableSeeds.forEach(seed => {
  console.log(`  npx ts-node prisma/seeds-a01/seed-${seed}.ts`);
});
