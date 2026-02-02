import {
  enum_location_type,
  enum_physical_count_type,
  enum_product_status_type,
  PrismaClient,
} from "@repo/prisma-shared-schema-tenant";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";

const prisma_client = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const prisma_platform = PrismaClient_SYSTEM;

async function get_user_by_username(username: string) {
  const user = await prisma_platform.tb_user.findFirst({
    where: {
      username: username,
    },
  });

  if (!user) {
    console.error(`User ${username} not found`);
    process.exit(1);
  }

  console.log(`User ${username} found`);

  return user;
}

async function upsert_unit(name: string, by_id: string) {
  // Find existing record
  const existing = await prisma_client.tb_unit.findFirst({
    where: {
      name: name,
      deleted_at: null,
    },
  });

  let unit;
  if (existing) {
    // Update existing record
    unit = await prisma_client.tb_unit.update({
      where: { id: existing.id },
      data: {
        name: name,
        description: name,
        is_active: true,
        updated_at: new Date(),
        updated_by_id: by_id,
      },
    });
  } else {
    // Create new record
    unit = await prisma_client.tb_unit.create({
      data: {
        name: name,
        description: name,
        is_active: true,
        created_at: new Date(),
        created_by_id: by_id,
      },
    });
  }

  console.log("Upserted unit:", unit);

  return unit;
}

async function mock_unit(by_id: string) {
  await upsert_unit("BAG", by_id);
  await upsert_unit("BOOK", by_id);
  await upsert_unit("BOX", by_id);
  await upsert_unit("BOX5", by_id);
  await upsert_unit("BOX12", by_id);
  await upsert_unit("BOX24", by_id);
  await upsert_unit("BOX25", by_id);
  await upsert_unit("BTL", by_id);
  await upsert_unit("CAN", by_id);
  await upsert_unit("CUP", by_id);
  await upsert_unit("CARTON", by_id);
  await upsert_unit("CASE", by_id);
  await upsert_unit("DRUM", by_id);
  await upsert_unit("FUT", by_id);
  await upsert_unit("GAL", by_id);
  await upsert_unit("GAL2", by_id);
  await upsert_unit("GM", by_id);
  await upsert_unit("HAND", by_id);
  await upsert_unit("JOB", by_id);
  await upsert_unit("KG", by_id);
  await upsert_unit("LOAF", by_id);
  await upsert_unit("LT", by_id);
  await upsert_unit("METERS", by_id);
  await upsert_unit("ML", by_id);
  await upsert_unit("PACK", by_id);
  await upsert_unit("PACK6", by_id);
  await upsert_unit("PACK12", by_id);
  await upsert_unit("PACK16", by_id);
  await upsert_unit("PAIR", by_id);
  await upsert_unit("PCS", by_id);
  await upsert_unit("POND", by_id);
  await upsert_unit("REAM", by_id);
  await upsert_unit("ROLL", by_id);
  await upsert_unit("ROOM", by_id);
  await upsert_unit("SACK", by_id);
  await upsert_unit("SACK40", by_id);
  await upsert_unit("STICK", by_id);
  await upsert_unit("SET", by_id);
  await upsert_unit("TANK", by_id);
  await upsert_unit("TIN", by_id);
  await upsert_unit("TRAY", by_id);
  await upsert_unit("TRAY24", by_id);
  await upsert_unit("TRUCK", by_id);
  await upsert_unit("UNIT", by_id);
}

async function upsert_product_category(
  name: string,
  code: string,
  by_id: string
) {
  // Find existing record
  const existing = await prisma_client.tb_product_category.findFirst({
    where: {
      code: code,
      name: name,
      deleted_at: null,
    },
  });

  let product_category;
  if (existing) {
    // Update existing record
    product_category = await prisma_client.tb_product_category.update({
      where: { id: existing.id },
      data: {
        code: code,
        name: name,
        is_active: true,
        updated_at: new Date(),
        updated_by_id: by_id,
      },
    });
  } else {
    // Create new record
    product_category = await prisma_client.tb_product_category.create({
      data: {
        name: name,
        code: code,
        created_at: new Date(),
        created_by_id: by_id,
        is_active: true,
      },
    });
  }

  console.log("Upserted product category:", product_category);

  return product_category;
}

async function upsert_product_sub_category(
  product_category_id: string,
  name: string,
  code: string,
  by_id: string
) {
  // Find existing record
  const existing = await prisma_client.tb_product_sub_category.findFirst({
    where: {
      code: code,
      name: name,
      deleted_at: null,
    },
  });

  let product_sub_category;
  if (existing) {
    // Update existing record
    product_sub_category = await prisma_client.tb_product_sub_category.update({
      where: { id: existing.id },
      data: {
        product_category_id: product_category_id,
        code: code,
        name: name,
        is_active: true,
        updated_at: new Date(),
        updated_by_id: by_id,
      },
    });
  } else {
    // Create new record
    product_sub_category = await prisma_client.tb_product_sub_category.create({
      data: {
        product_category_id: product_category_id,
        name: name,
        code: code,
        created_at: new Date(),
        created_by_id: by_id,
        is_active: true,
      },
    });
  }

  console.log("Upserted product sub category:", product_sub_category);

  return product_sub_category;
}

async function upsert_product_item_group(
  product_sub_category_id: string,
  name: string,
  code: string,
  by_id: string
) {
  // Find existing record
  const existing = await prisma_client.tb_product_item_group.findFirst({
    where: {
      code: code,
      name: name,
      product_subcategory_id: product_sub_category_id,
      deleted_at: null,
    },
  });

  let product_item_group;
  if (existing) {
    // Update existing record
    product_item_group = await prisma_client.tb_product_item_group.update({
      where: { id: existing.id },
      data: {
        product_subcategory_id: product_sub_category_id,
        name: name,
        code: code,
        is_active: true,
        updated_at: new Date(),
        updated_by_id: by_id,
      },
    });
  } else {
    // Create new record
    product_item_group = await prisma_client.tb_product_item_group.create({
      data: {
        product_subcategory_id: product_sub_category_id,
        name: name,
        code: code,
        created_at: new Date(),
        created_by_id: by_id,
        is_active: true,
      },
    });
  }

  console.log("Upserted product item group:", product_item_group);

  return product_item_group;
}

async function mock_product_category(by_id: string) {
  // Food
  const category_food = await upsert_product_category("Food", "1", by_id);

  // Meat
  const sub_category_Meat = await upsert_product_sub_category(
    category_food.id,
    "Meat",
    "10",
    by_id
  );
  const item_group_Beef = await upsert_product_item_group(
    sub_category_Meat.id,
    "Beef",
    "1000",
    by_id
  );
  const item_group_Pork = await upsert_product_item_group(
    sub_category_Meat.id,
    "Pork",
    "1001",
    by_id
  );
  const item_group_Chicken = await upsert_product_item_group(
    sub_category_Meat.id,
    "Chicken",
    "1002",
    by_id
  );
  const item_group_Duck = await upsert_product_item_group(
    sub_category_Meat.id,
    "Duck",
    "1003",
    by_id
  );
  const item_group_Meat_Ball = await upsert_product_item_group(
    sub_category_Meat.id,
    "Meat Ball",
    "1004",
    by_id
  );
  const item_group_OSausage_Bacon_Ham = await upsert_product_item_group(
    sub_category_Meat.id,
    "Sausage / Bacon / Ham",
    "1005",
    by_id
  );
  const item_group_Lamb = await upsert_product_item_group(
    sub_category_Meat.id,
    "Lamb",
    "1006",
    by_id
  );

  // Seafood
  const sub_category_Seafood = await upsert_product_sub_category(
    category_food.id,
    "Seafood",
    "11",
    by_id
  );
  const item_group_Fish = await upsert_product_item_group(
    sub_category_Seafood.id,
    "Fish",
    "1100",
    by_id
  );
  const item_group_Prawn = await upsert_product_item_group(
    sub_category_Seafood.id,
    "Prawn",
    "1101",
    by_id
  );
  const item_group_Squid = await upsert_product_item_group(
    sub_category_Seafood.id,
    "Squid",
    "1102",
    by_id
  );
  const item_group_Crab = await upsert_product_item_group(
    sub_category_Seafood.id,
    "Crab",
    "1103",
    by_id
  );
  const item_group_Shell = await upsert_product_item_group(
    sub_category_Seafood.id,
    "Shell",
    "1104",
    by_id
  );

  // Fruits & Vegetable
  const sub_category_Fruits_Vegetable = await upsert_product_sub_category(
    category_food.id,
    "Fruits & Vegetable",
    "12",
    by_id
  );
  const item_group_Fruits = await upsert_product_item_group(
    sub_category_Fruits_Vegetable.id,
    "Fruits",
    "1200",
    by_id
  );
  const item_group_Vegetables = await upsert_product_item_group(
    sub_category_Fruits_Vegetable.id,
    "Vegetables",
    "1201",
    by_id
  );
  const item_group_Thai_Dessert = await upsert_product_item_group(
    sub_category_Fruits_Vegetable.id,
    "Thai Dessert",
    "1202",
    by_id
  );
  const item_group_Frozen = await upsert_product_item_group(
    sub_category_Fruits_Vegetable.id,
    "Frozen",
    "1203",
    by_id
  );

  // Preserves / Juices
  const sub_category_Preserves_Juices = await upsert_product_sub_category(
    category_food.id,
    "Preserves / Juices",
    "13",
    by_id
  );
  const item_group_Juices = await upsert_product_item_group(
    sub_category_Preserves_Juices.id,
    "Juices",
    "1300",
    by_id
  );

  // Dairy Products
  const sub_category_Dairy_Products = await upsert_product_sub_category(
    category_food.id,
    "Dairy Products",
    "14",
    by_id
  );
  const item_group_Milk = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Milk",
    "1400",
    by_id
  );
  const item_group_Butter_Mayonnaise = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Butter / Mayonnaise",
    "1401",
    by_id
  );
  const item_group_Cheese = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Cheese",
    "1402",
    by_id
  );
  const item_group_Cream_Topping = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Cream / Topping",
    "1403",
    by_id
  );
  const item_group_Yoghurt = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Yoghurt",
    "1404",
    by_id
  );
  const item_group_Ice_Cream = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Ice Cream",
    "1405",
    by_id
  );
  const item_group_Egg = await upsert_product_item_group(
    sub_category_Dairy_Products.id,
    "Egg",
    "1406",
    by_id
  );

  // Dry Goods
  const sub_category_Dry_Goods = await upsert_product_sub_category(
    category_food.id,
    "Dry Goods",
    "15",
    by_id
  );
  const item_group_Coffee_Tea_Hot_Bev = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Coffee / Tea / Hot Bev.",
    "1500",
    by_id
  );
  const item_group_Dried_Food_Nuts = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Dried Food / Nuts",
    "1501",
    by_id
  );
  const item_group_Pasta = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Pasta",
    "1502",
    by_id
  );
  const item_group_Noodles = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Noodles",
    "1503",
    by_id
  );
  const item_group_Flour = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Flour",
    "1504",
    by_id
  );
  const item_group_Curry = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Curry",
    "1505",
    by_id
  );
  const item_group_Cereal = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Cereal",
    "1506",
    by_id
  );
  const item_group_Pastry_Bakery = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Pastry / Bakery",
    "1507",
    by_id
  );
  const item_group_Sugar_Syrup = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Sugar / Syrup",
    "1508",
    by_id
  );
  const item_group_Jam = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Jam",
    "1509",
    by_id
  );
  const item_group_Oil = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Oil",
    "1510",
    by_id
  );
  const item_group_Sauce = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Sauce",
    "1511",
    by_id
  );
  const item_group_Seasoning = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Seasoning",
    "1512",
    by_id
  );
  const item_group_Rice = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Rice",
    "1513",
    by_id
  );
  const item_group_Tofu = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Tofu",
    "1514",
    by_id
  );
  const item_group_Snack_Food = await upsert_product_item_group(
    sub_category_Dry_Goods.id,
    "Snack Food",
    "1515",
    by_id
  );

  // Other Foods
  const sub_category_Other_Foods = await upsert_product_sub_category(
    category_food.id,
    "Other Foods",
    "16",
    by_id
  );
  const item_group_French_Fries_Dimsum = await upsert_product_item_group(
    sub_category_Other_Foods.id,
    "French Fries / Dimsum",
    "1600",
    by_id
  );
  const item_group_Japaness_Food = await upsert_product_item_group(
    sub_category_Other_Foods.id,
    "Japaness Food",
    "1601",
    by_id
  );
  const item_group_Indian_Food = await upsert_product_item_group(
    sub_category_Other_Foods.id,
    "Indian Food",
    "1602",
    by_id
  );
  const item_group_Ice = await upsert_product_item_group(
    sub_category_Other_Foods.id,
    "Ice",
    "1603",
    by_id
  );

  // Beverage
  const category_Beverage = await upsert_product_category(
    "Beverage",
    "2",
    by_id
  );

  // Soft Drink
  const sub_category_Soft_Drink = await upsert_product_sub_category(
    category_Beverage.id,
    "Soft Drink",
    "20",
    by_id
  );
  const item_group_Soft_Drink = await upsert_product_item_group(
    sub_category_Soft_Drink.id,
    "Soft Drink",
    "2000",
    by_id
  );
  const item_group_Water = await upsert_product_item_group(
    sub_category_Soft_Drink.id,
    "Water",
    "2001",
    by_id
  );

  // Beers
  const sub_category_Beers = await upsert_product_sub_category(
    category_Beverage.id,
    "Beers",
    "21",
    by_id
  );
  const item_group_Beers = await upsert_product_item_group(
    sub_category_Beers.id,
    "Beers",
    "2100",
    by_id
  );
  const item_group_Import_Beer = await upsert_product_item_group(
    sub_category_Beers.id,
    "Import Beer",
    "2101",
    by_id
  );
  const item_group_Beer_Draught = await upsert_product_item_group(
    sub_category_Beers.id,
    "Beer Draught",
    "2102",
    by_id
  );

  // Spirits
  const sub_category_Spirits = await upsert_product_sub_category(
    category_Beverage.id,
    "Spirits",
    "22",
    by_id
  );
  const item_group_Apperitif = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Apperitif",
    "2200",
    by_id
  );
  const item_group_Eua_De_Vie_Port_Sherry = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Eua De Vie / Port Sherry",
    "2201",
    by_id
  );
  const item_group_Brandy_Congnac = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Brandy / Congnac",
    "2202",
    by_id
  );
  const item_group_Whisky_Import = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Whisky-Import",
    "2203",
    by_id
  );
  const item_group_Whisky_Thai = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Whisky-Thai",
    "2204",
    by_id
  );
  const item_group_Rum = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Rum",
    "2205",
    by_id
  );
  const item_group_Gin = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Gin",
    "2206",
    by_id
  );
  const item_group_Vodka = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Vodka",
    "2207",
    by_id
  );
  const item_group_Tequilla = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Tequilla",
    "2208",
    by_id
  );
  const item_group_Liquerus = await upsert_product_item_group(
    sub_category_Spirits.id,
    "Liquerus",
    "2209",
    by_id
  );

  // Wine / Champagne
  const sub_category_Wine_Champagne = await upsert_product_sub_category(
    category_Beverage.id,
    "Wine / Champagne",
    "23",
    by_id
  );
  const item_group_White_Wine = await upsert_product_item_group(
    sub_category_Wine_Champagne.id,
    "White Wine",
    "2300",
    by_id
  );
  const item_group_Red_Wine = await upsert_product_item_group(
    sub_category_Wine_Champagne.id,
    "Red Wine",
    "2301",
    by_id
  );
  const item_group_Rose_Wine = await upsert_product_item_group(
    sub_category_Wine_Champagne.id,
    "Rose Wine",
    "2302",
    by_id
  );
  const item_group_Sparkling_Champagne = await upsert_product_item_group(
    sub_category_Wine_Champagne.id,
    "Sparkling / Champagne",
    "2303",
    by_id
  );

  // General
  const category_General = await upsert_product_category("General", "3", by_id);

  // Printing & Stationery
  const sub_category_Printing_Stationery = await upsert_product_sub_category(
    category_General.id,
    "Printing & Stationery",
    "30",
    by_id
  );
  const item_group_Stationery = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Stationery",
    "3000",
    by_id
  );
  const item_group_Toner_Ink = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Toner/Ink",
    "3001",
    by_id
  );
  const item_group_Paper_Supplies = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Paper Supplies",
    "3002",
    by_id
  );
  const item_group_Form_Front = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Form-Front",
    "3003",
    by_id
  );
  const item_group_Form_Housekeeping = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Form-Housekeeping",
    "3004",
    by_id
  );
  const item_group_Form_F_B = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Form- F&B",
    "3005",
    by_id
  );
  const item_group_Form_Other = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Form-Other",
    "3006",
    by_id
  );
  const item_group_Business_Card = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Business Card",
    "3007",
    by_id
  );
  const item_group_Menu_Wine_List = await upsert_product_item_group(
    sub_category_Printing_Stationery.id,
    "Menu & Wine List",
    "3008",
    by_id
  );

  // Guest Supplies
  const sub_category_Guest_Supplies = await upsert_product_sub_category(
    category_General.id,
    "Guest Supplies",
    "31",
    by_id
  );
  const item_group_Guest_Supplies_Room = await upsert_product_item_group(
    sub_category_Guest_Supplies.id,
    "Guest Supplies-Room",
    "3100",
    by_id
  );
  const item_group_Kitchen_Fuel = await upsert_product_item_group(
    sub_category_Guest_Supplies.id,
    "Kitchen Fuel",
    "3101",
    by_id
  );
  const item_group_Guest_Supplies_F_B = await upsert_product_item_group(
    sub_category_Guest_Supplies.id,
    "Guest Supplies-F&B",
    "3102",
    by_id
  );
  const item_group_Kitchen_Supply = await upsert_product_item_group(
    sub_category_Guest_Supplies.id,
    "Kitchen Supply",
    "3103",
    by_id
  );

  // Cleaning Supplies
  const sub_category_Cleaning_Supplies = await upsert_product_sub_category(
    category_General.id,
    "Cleaning Supplies",
    "32",
    by_id
  );
  const item_group_Cleaning_Equipment = await upsert_product_item_group(
    sub_category_Cleaning_Supplies.id,
    "Cleaning-Equipment",
    "3200",
    by_id
  );
  const item_group_Cleaning_Chemical = await upsert_product_item_group(
    sub_category_Cleaning_Supplies.id,
    "Cleaning-Chemical",
    "3201",
    by_id
  );
  const item_group_Cleaning_Service = await upsert_product_item_group(
    sub_category_Cleaning_Supplies.id,
    "Cleaning Service",
    "3202",
    by_id
  );

  // Collateral / Marketing
  const sub_category_Housekeeping_Supplies = await upsert_product_sub_category(
    category_General.id,
    "Housekeeping Supplies",
    "33",
    by_id
  );
  const item_group_Suvenier_Gifts = await upsert_product_item_group(
    sub_category_Housekeeping_Supplies.id,
    "Suvenier Gifts",
    "3300",
    by_id
  );
  const item_group_Brochure = await upsert_product_item_group(
    sub_category_Housekeeping_Supplies.id,
    "Brochure",
    "3301",
    by_id
  );
  const item_group_Broucher_for_Trade_Show = await upsert_product_item_group(
    sub_category_Housekeeping_Supplies.id,
    "Broucher for Trade Show",
    "3302",
    by_id
  );
  const item_group_Flyer_Fact_Sheet = await upsert_product_item_group(
    sub_category_Housekeeping_Supplies.id,
    "Flyer / Fact Sheet",
    "3303",
    by_id
  );

  // Others
  const sub_category_Others = await upsert_product_sub_category(
    category_General.id,
    "Others",
    "34",
    by_id
  );
  const item_group_Flag = await upsert_product_item_group(
    sub_category_Others.id,
    "Flag",
    "3400",
    by_id
  );
  const item_group_Signage = await upsert_product_item_group(
    sub_category_Others.id,
    "Signage",
    "3401",
    by_id
  );
  const item_group_Other_General = await upsert_product_item_group(
    sub_category_Others.id,
    "Other General",
    "3402",
    by_id
  );
  const item_group_Soft_Ware = await upsert_product_item_group(
    sub_category_Others.id,
    "Soft Ware",
    "3403",
    by_id
  );
  const item_group_Software = await upsert_product_item_group(
    sub_category_Others.id,
    "Software",
    "3404",
    by_id
  );
  const item_group_Expense = await upsert_product_item_group(
    sub_category_Others.id,
    "Expense",
    "3405",
    by_id
  );

  // Operating equipment
  const category_Operating_equipment = await upsert_product_category(
    "Operating equipment",
    "4",
    by_id
  );

  // Linen
  const sub_category_Linen = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Linen",
    "40",
    by_id
  );
  const item_group_Linen = await upsert_product_item_group(
    sub_category_Linen.id,
    "Linen",
    "4000",
    by_id
  );

  // Glassware
  const sub_category_Glassware = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Glassware",
    "41",
    by_id
  );
  const item_group_Glassware = await upsert_product_item_group(
    sub_category_Glassware.id,
    "Glassware",
    "4100",
    by_id
  );

  // Chinaware
  const sub_category_Chinaware = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Chinaware",
    "42",
    by_id
  );
  const item_group_Chinaware = await upsert_product_item_group(
    sub_category_Chinaware.id,
    "Chinaware",
    "4200",
    by_id
  );

  // Silverware
  const sub_category_Silverware = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Silverware",
    "43",
    by_id
  );
  const item_group_Silverware = await upsert_product_item_group(
    sub_category_Silverware.id,
    "Silverware",
    "4300",
    by_id
  );

  // Cutlery ware
  const sub_category_Cutlery_Ware = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Cutlery Ware",
    "44",
    by_id
  );
  const item_group_Cutlery_Ware = await upsert_product_item_group(
    sub_category_Cutlery_Ware.id,
    "Cutlery Ware",
    "4400",
    by_id
  );

  // Uniform
  const sub_category_Uniform = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Uniform",
    "45",
    by_id
  );
  const item_group_Uniform_Rooms = await upsert_product_item_group(
    sub_category_Uniform.id,
    "Uniform Rooms",
    "4500",
    by_id
  );
  const item_group_Uniform_F_B = await upsert_product_item_group(
    sub_category_Uniform.id,
    "Uniform F&B",
    "4501",
    by_id
  );
  const item_group_Uniform_ENG = await upsert_product_item_group(
    sub_category_Uniform.id,
    "Uniform ENG.",
    "4502",
    by_id
  );
  const item_group_Uniform_Back_Office = await upsert_product_item_group(
    sub_category_Uniform.id,
    "Uniform Back Office",
    "4503",
    by_id
  );

  // Equipment
  const sub_category_Equipment = await upsert_product_sub_category(
    category_Operating_equipment.id,
    "Equipment",
    "47",
    by_id
  );
  const item_group_Eqp_FB = await upsert_product_item_group(
    sub_category_Equipment.id,
    "Eqp - FB",
    "4700",
    by_id
  );
  const item_group_Eqp_MK = await upsert_product_item_group(
    sub_category_Equipment.id,
    "Eqp - MK",
    "4701",
    by_id
  );
  const item_group_Eqp_Spa = await upsert_product_item_group(
    sub_category_Equipment.id,
    "Eqp - Spa",
    "4702",
    by_id
  );

  // Engineering
  const category_Engineering = await upsert_product_category(
    "Engineering",
    "5",
    by_id
  );

  // Building
  const sub_category_Building = await upsert_product_sub_category(
    category_Engineering.id,
    "Building",
    "50",
    by_id
  );
  const item_group_Furniture_Fixtures = await upsert_product_item_group(
    sub_category_Building.id,
    "Furniture / Fixtures",
    "5000",
    by_id
  );
  const item_group_Curtain_Draperies = await upsert_product_item_group(
    sub_category_Building.id,
    "Curtain & Draperies",
    "5001",
    by_id
  );
  const item_group_Floor_Covering = await upsert_product_item_group(
    sub_category_Building.id,
    "Floor Covering",
    "5002",
    by_id
  );
  const item_group_Painting_Decorating = await upsert_product_item_group(
    sub_category_Building.id,
    "Painting & Decorating",
    "5003",
    by_id
  );
  const item_group_Plumbing = await upsert_product_item_group(
    sub_category_Building.id,
    "Plumbing",
    "5004",
    by_id
  );
  const item_group_Grounds_Landscaping = await upsert_product_item_group(
    sub_category_Building.id,
    "Grounds & Landscaping",
    "5005",
    by_id
  );
  const item_group_Building_Glass_Mirror = await upsert_product_item_group(
    sub_category_Building.id,
    "Building - Glass & Mirror",
    "5006",
    by_id
  );

  // Electrical
  const sub_category_Electrical = await upsert_product_sub_category(
    category_Engineering.id,
    "Electric",
    "51",
    by_id
  );
  const item_group_Lights_Bulb = await upsert_product_item_group(
    sub_category_Electrical.id,
    "Lights Bulb",
    "5100",
    by_id
  );
  const item_group_Television_Radio = await upsert_product_item_group(
    sub_category_Electrical.id,
    "Television & Radio",
    "5101",
    by_id
  );
  const item_group_Electircal_Equipment = await upsert_product_item_group(
    sub_category_Electrical.id,
    "Electircal Equipment",
    "5102",
    by_id
  );
  const item_group_Sound_System = await upsert_product_item_group(
    sub_category_Electrical.id,
    "Sound System",
    "5103",
    by_id
  );
  const item_group_IT_Equipment = await upsert_product_item_group(
    sub_category_Electrical.id,
    "IT Equipment",
    "5104",
    by_id
  );

  // Tools & Eng.Supply
  const sub_category_Tools_Eng_Supply = await upsert_product_sub_category(
    category_Engineering.id,
    "Tools & Eng.Supply",
    "52",
    by_id
  );
  const item_group_Tools = await upsert_product_item_group(
    sub_category_Tools_Eng_Supply.id,
    "Tools",
    "5200",
    by_id
  );
  const item_group_Eng_Supply = await upsert_product_item_group(
    sub_category_Tools_Eng_Supply.id,
    "Eng.Supply",
    "5201",
    by_id
  );
  const item_group_Garden = await upsert_product_item_group(
    sub_category_Tools_Eng_Supply.id,
    "Garden",
    "5202",
    by_id
  );

  // Fuel & Chemical
  const sub_category_Fuel_Chemical = await upsert_product_sub_category(
    category_Engineering.id,
    "Fuel & Chemical",
    "53",
    by_id
  );
  const item_group_Fuel_Disel = await upsert_product_item_group(
    sub_category_Fuel_Chemical.id,
    "Fuel & Disel",
    "5300",
    by_id
  );
  const item_group_Chemical_Eng = await upsert_product_item_group(
    sub_category_Fuel_Chemical.id,
    "Chemical (Eng)",
    "5302",
    by_id
  );

  // Swimming Pool
  const sub_category_Swimming_Pool = await upsert_product_sub_category(
    category_Engineering.id,
    "Swimming Pool",
    "54",
    by_id
  );
  const item_group_Swimming_Pool = await upsert_product_item_group(
    sub_category_Swimming_Pool.id,
    "Swimming Pool",
    "5400",
    by_id
  );

  //Fire & Life Safety
  const sub_category_Fire_Life_Safety = await upsert_product_sub_category(
    category_Engineering.id,
    "Fire & Life Safety",
    "55",
    by_id
  );
  const item_group_Fire_Life_Safety = await upsert_product_item_group(
    sub_category_Fire_Life_Safety.id,
    "Fire & Life Safety",
    "5500",
    by_id
  );

  // Repair&Maintenance
  const sub_category_Repair_Maintenance = await upsert_product_sub_category(
    category_Engineering.id,
    "Repair&Maintenance",
    "57",
    by_id
  );
  const item_group_R_M_Equipment = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Equipment-ENG",
    "5700",
    by_id
  );
  const item_group_R_M_Computer_Hardware = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Computer Hardware-ENG",
    "5701",
    by_id
  );
  const item_group_R_M_Office_Equipment = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Office Equipment-ENG",
    "5702",
    by_id
  );
  const item_group_R_M_Building = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Building-ENG",
    "5703",
    by_id
  );
  const item_group_R_M_Glass_Repairing_Modification =
    await upsert_product_item_group(
      sub_category_Repair_Maintenance.id,
      "R&M - Glass Repairing & Modification-ENG",
      "5704",
      by_id
    );
  const item_group_R_M_Elevators = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Elevators-ENG",
    "5705",
    by_id
  );
  const item_group_R_M_Swimming_Pool = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Swimming Pool-ENG",
    "5706",
    by_id
  );
  const item_group_R_M_Furniture_Fixture = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Furniture & Fixture-ENG",
    "5707",
    by_id
  );
  const item_group_R_M_Air_Condition = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Air Condition-ENG",
    "5708",
    by_id
  );
  const item_group_R_M_Sanitary_Ware = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Sanitary Ware-ENG",
    "5709",
    by_id
  );
  const item_group_R_M_Plumbing_Heating = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Plumbing & Heating-ENG",
    "5710",
    by_id
  );
  const item_group_R_M_Electrical = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Electrical-ENG",
    "5711",
    by_id
  );
  const item_group_R_M_Fire_Alarm_System = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Fire Alarm System-ENG",
    "5712",
    by_id
  );
  const item_group_R_M_Telephone = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Telephone-ENG",
    "5713",
    by_id
  );
  const item_group_R_M_Television = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Television-ENG",
    "5714",
    by_id
  );
  const item_group_R_M_Other = await upsert_product_item_group(
    sub_category_Repair_Maintenance.id,
    "R&M - Other-ENG",
    "5715",
    by_id
  );

  // Fixed Assets
  const category_Fixed_Assets = await upsert_product_category(
    "Fixed Assets",
    "6",
    by_id
  );

  // Land
  const sub_category_Land = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Land",
    "60",
    by_id
  );
  const item_group_Land = await upsert_product_item_group(
    sub_category_Land.id,
    "Land",
    "6000",
    by_id
  );
  const item_group_Land_Improvement = await upsert_product_item_group(
    sub_category_Land.id,
    "Land Improvement",
    "6001",
    by_id
  );

  // Building
  const sub_category_Building_Fixed_Assets = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Building",
    "61",
    by_id
  );
  const item_group_Building = await upsert_product_item_group(
    sub_category_Building_Fixed_Assets.id,
    "Building",
    "6100",
    by_id
  );
  const item_group_Building_Improvement = await upsert_product_item_group(
    sub_category_Building_Fixed_Assets.id,
    "Building Improvement",
    "6101",
    by_id
  );

  // Air Condition System
  const sub_category_Air_Condition_System = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Air Condition System",
    "62",
    by_id
  );
  const item_group_Air_Condition_System = await upsert_product_item_group(
    sub_category_Air_Condition_System.id,
    "Air Condition System",
    "6200",
    by_id
  );

  // Furniture and fixture
  const sub_category_Furniture_Fixture = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Furniture and fixture",
    "63",
    by_id
  );
  const item_group_Bed = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Bed",
    "6300",
    by_id
  );
  const item_group_Table = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Table",
    "6301",
    by_id
  );
  const item_group_Cabinet = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Cabinet",
    "6302",
    by_id
  );
  const item_group_Chair = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Chair",
    "6303",
    by_id
  );
  const item_group_Mattress = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Mattress",
    "6303",
    by_id
  );
  const item_group_Fan = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Fan",
    "6304",
    by_id
  );
  const item_group_Refrigerator = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Refrigerator",
    "6305",
    by_id
  );
  const item_group_Furniture = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Furniture",
    "6306",
    by_id
  );
  const item_group_Curtain = await upsert_product_item_group(
    sub_category_Furniture_Fixture.id,
    "Curtain",
    "6307",
    by_id
  );

  // Safety Equipment
  const sub_category_Safety_Equipment = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Safety Equipment",
    "64",
    by_id
  );
  const item_group_Extinguisher = await upsert_product_item_group(
    sub_category_Safety_Equipment.id,
    "Extinguisher",
    "6400",
    by_id
  );
  const item_group_Safety_Equipment = await upsert_product_item_group(
    sub_category_Safety_Equipment.id,
    "Safety Equipment",
    "6401",
    by_id
  );

  // Music & Sound System
  const sub_category_Music_Sound_System = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Music & Sound System",
    "65",
    by_id
  );
  const item_group_Audio = await upsert_product_item_group(
    sub_category_Music_Sound_System.id,
    "Audio",
    "6500",
    by_id
  );
  const item_group_Speaker = await upsert_product_item_group(
    sub_category_Music_Sound_System.id,
    "Speaker",
    "6501",
    by_id
  );
  const item_group_Microphone = await upsert_product_item_group(
    sub_category_Music_Sound_System.id,
    "Microphone",
    "6502",
    by_id
  );

  // Sanitary Ware
  const sub_category_Sanitary_Ware = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Sanitary Ware",
    "66",
    by_id
  );
  const item_group_Bathtub = await upsert_product_item_group(
    sub_category_Sanitary_Ware.id,
    "Bathtub",
    "6600",
    by_id
  );
  const item_group_Toilet_Bowl = await upsert_product_item_group(
    sub_category_Sanitary_Ware.id,
    "Toilet Bowl",
    "6601",
    by_id
  );
  const item_group_Wash_Basin = await upsert_product_item_group(
    sub_category_Sanitary_Ware.id,
    "Wash Basin",
    "6602",
    by_id
  );

  // Computer System
  const sub_category_Other_Fixed_Assets = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Other Fixed Assets",
    "67",
    by_id
  );
  const item_group_Computer_Hardware = await upsert_product_item_group(
    sub_category_Other_Fixed_Assets.id,
    "Computer - Hardware",
    "6700",
    by_id
  );
  const item_group_Computer_Software = await upsert_product_item_group(
    sub_category_Other_Fixed_Assets.id,
    "Computer - Software",
    "6701",
    by_id
  );

  // Pumping System
  const sub_category_Pumping_System = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Pumping System",
    "68",
    by_id
  );
  const item_group_Pumping_System = await upsert_product_item_group(
    sub_category_Pumping_System.id,
    "Pumping System",
    "6800",
    by_id
  );
  const item_group_Pumping = await upsert_product_item_group(
    sub_category_Pumping_System.id,
    "Pumping",
    "6801",
    by_id
  );

  // Electrical System
  const sub_category_Electrical_System = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Electrical System",
    "69",
    by_id
  );
  const item_group_Electrical_System = await upsert_product_item_group(
    sub_category_Electrical_System.id,
    "Electrical System",
    "6900",
    by_id
  );

  // Fire Alarm System
  const sub_category_Fire_Alarm_System = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Fire Alarm System",
    "70",
    by_id
  );
  const item_group_Fire_Alarm_System = await upsert_product_item_group(
    sub_category_Fire_Alarm_System.id,
    "Fire Alarm System",
    "7000",
    by_id
  );

  // Telephone
  const sub_category_Telephone = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Telephone",
    "71",
    by_id
  );
  const item_group_Telephone = await upsert_product_item_group(
    sub_category_Telephone.id,
    "Telephone",
    "7100",
    by_id
  );

  // Television
  const sub_category_Television = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Television & Radio",
    "72",
    by_id
  );
  const item_group_TV = await upsert_product_item_group(
    sub_category_Television.id,
    "TV",
    "7200",
    by_id
  );
  const item_group_Radio = await upsert_product_item_group(
    sub_category_Television.id,
    "Radio",
    "7201",
    by_id
  );
  const item_group_Projector = await upsert_product_item_group(
    sub_category_Television.id,
    "Projector",
    "7202",
    by_id
  );

  // Vehicles
  const sub_category_Vehicles = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Vehicles",
    "73",
    by_id
  );
  const item_group_Car = await upsert_product_item_group(
    sub_category_Vehicles.id,
    "Car",
    "7300",
    by_id
  );
  const item_group_Motorcycle = await upsert_product_item_group(
    sub_category_Vehicles.id,
    "Motorcycle",
    "7301",
    by_id
  );

  // Equipment
  const sub_category_Equipment_Fixed_Assets = await upsert_product_sub_category(
    category_Fixed_Assets.id,
    "Equipment",
    "74",
    by_id
  );
  const item_group_Equipment_Housekeeping = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Housekeeping",
    "7400",
    by_id
  );
  const item_group_Equipment_Laundry = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Laundry",
    "7401",
    by_id
  );
  const item_group_Equipment_Mechanical = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Mechanical",
    "7402",
    by_id
  );
  const item_group_Equipment_Engineering = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Engineering",
    "7403",
    by_id
  );
  const item_group_Equipment_Sport = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Sport",
    "7404",
    by_id
  );
  const item_group_Equipment_Guest = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Guest",
    "7405",
    by_id
  );
  const item_group_Equipment_Spa = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Spa",
    "7406",
    by_id
  );
  const item_group_Equipment_Office = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Office",
    "7407",
    by_id
  );
  const item_group_Equipment_FB = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - FB",
    "7408",
    by_id
  );
  const item_group_Equipment_Kitchen = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - Kitchen",
    "7409",
    by_id
  );
  const item_group_Equipment_General = await upsert_product_item_group(
    sub_category_Equipment_Fixed_Assets.id,
    "Equipment - General",
    "7410",
    by_id
  );

  // Consignment
  const category_Consignment = await upsert_product_category(
    "Consignment",
    "8",
    by_id
  );

  // Consignment Restaurant
  const sub_category_Consignment_Restaurant = await upsert_product_sub_category(
    category_Consignment.id,
    "Consignment Restaurant",
    "80",
    by_id
  );
  const item_group_Consignment_White_Wine = await upsert_product_item_group(
    sub_category_Consignment_Restaurant.id,
    "Consignment White Wine",
    "8000",
    by_id
  );
  const item_group_Consignment_Red_Wine = await upsert_product_item_group(
    sub_category_Consignment_Restaurant.id,
    "Consignment Red Wine",
    "8001",
    by_id
  );
  const item_group_Consignment_Champagne = await upsert_product_item_group(
    sub_category_Consignment_Restaurant.id,
    "Consignment Champagne",
    "8002",
    by_id
  );
  const item_group_Consignment_Ice_Cream = await upsert_product_item_group(
    sub_category_Consignment_Restaurant.id,
    "Consignment Ice Cream",
    "8003",
    by_id
  );

  // Consignmen Souvenir
  const sub_category_Consignment_Souvenir = await upsert_product_sub_category(
    category_Consignment.id,
    "Consignment Souvenir",
    "81",
    by_id
  );
  const item_group_Consignment_Souvenir = await upsert_product_item_group(
    sub_category_Consignment_Souvenir.id,
    "Consignment Mat",
    "8100",
    by_id
  );

  // Decoration
  const category_Decoration = await upsert_product_category(
    "Decoration",
    "9",
    by_id
  );

  // Decorate
  const sub_category_Decorate = await upsert_product_sub_category(
    category_Decoration.id,
    "Decorate",
    "90",
    by_id
  );
  const item_group_Flower_Decorate = await upsert_product_item_group(
    sub_category_Decorate.id,
    "Flower Decorate",
    "9000",
    by_id
  );
  const item_group_Equipment_Decorate = await upsert_product_item_group(
    sub_category_Decorate.id,
    "Equipment Decorate",
    "9001",
    by_id
  );
  const item_group_Spirit_House = await upsert_product_item_group(
    sub_category_Decorate.id,
    "Spirit House",
    "9002",
    by_id
  );
}

async function get_units_list() {
  const units = await prisma_client.tb_unit.findMany();
  return units.map((unit) => {
    return {
      id: unit.id,
      name: unit.name,
    };
  });
}

async function get_product_item_groups_list() {
  const product_item_groups =
    await prisma_client.tb_product_item_group.findMany();
  return product_item_groups.map((product_item_group) => {
    return {
      id: product_item_group.id,
      name: product_item_group.name,
      code: product_item_group.code,
    };
  });
}

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function mock_product(by_id: string) {
  const units = await get_units_list();
  const product_item_groups = await get_product_item_groups_list();

  const products = [
    {
      Code: 10000001,
      name: "Beef Tenderloin",
      localname: "เนื้อสันใน",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10000002,
      name: "Ground Beef A",
      localname: "เนื้อบด A",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10000003,
      name: "Beef Tenderloin Grade A",
      localname: "เนื้อสันในโคขุนแต่ง เกรด A",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10000004,
      name: "Beef Tenderloin Grade AAA",
      localname: "เนื้อสันในโคขุนแต่ง เกรด AAA",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10000005,
      name: "Beef Hip Top",
      localname: "เนื้อสะโพกโคขุน",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10000006,
      name: "Beef Burger 150G.",
      localname: "เบอร์เกอร์เนื้อ 150กรัม",
      item_group: 1000,
      InventoryUnit: "Kg",
      OrderUnit: "Kg",
    },
    {
      Code: 10010001,
      name: "Ground Pork",
      localname: "หมูบด",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010002,
      name: "Pork Loin",
      localname: "หมูสันนอก",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010003,
      name: "Pork Top Round",
      localname: "หมูสะโพก",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010004,
      name: "Pork Top Round Slice",
      localname: "หมูสะโพกหั่นชิ้น",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010005,
      name: "Pork Fillet",
      localname: "หมูสันใน",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010006,
      name: "Pork Spare Ribs",
      localname: "ซี่โครงหมูอ่อน สับ",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010007,
      name: "Pork Spare Ribs",
      localname: "ซี่โครงหมูสับ",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010008,
      name: "Oil Pork Frozen",
      localname: "มันหมูแช่แข็ง",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010009,
      name: "Ground Pork Grade",
      localname: "หมูบดเกรดA",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020001,
      name: "Chicken Ground",
      localname: "ไก่บด",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020002,
      name: "Chicken Hip Boneles Skin On",
      localname: "สะโพกไก่ ติดหนัง ไม่มีกระดูก",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020003,
      name: "Chicken Hip Boneles Skin Skinless",
      localname: "สะโพกไก่ ลอกหนัง ไม่มีกระดูก",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020004,
      name: "Chicken Breast-Skin Less (SBB)",
      localname: "อกไก่ลอกหนัง",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020005,
      name: "Chicken Breast-Skin On (BB)",
      localname: "อกไก่ติดหนัง",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020006,
      name: "Chicken Wing Full",
      localname: "ปีกไก่เต็ม",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020007,
      name: "Chicken Bone",
      localname: "โครงไก่",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020008,
      name: "Chicken Middle",
      localname: "ปีกไก่กลาง",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11010001,
      name: "White Shrimp 25pcs./kg.",
      localname: "กุ้งขาวใหญ่เลี้ยง 25 ตัว/กก.",
      item_group: 1101,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11010002,
      name: "PDTO.White Shrimp 30-40pcs/kg.",
      localname: "กุ้งขาวแช่แข็ง 30-40 ตัว/กก.",
      item_group: 1101,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10050001,
      name: "Bologna Chicken Chilli",
      localname: "โบโลโญญ่าไก่พริกสด",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10050002,
      name: "Bologna Chicken",
      localname: "โบโลโญญ่าไก่พริกสด",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10050003,
      name: "Chicken Ham",
      localname: "แฮมไก่",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14060001,
      name: "Egg No.3",
      localname: "ไข่ไก่ เบอร์3",
      item_group: 1406,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14060002,
      name: "Egg No.4",
      localname: "ไข่ไก่ เบอร์4",
      item_group: 1406,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14060003,
      name: "Salted Egg",
      localname: "ไข่เค็ม",
      item_group: 1406,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10050004,
      name: "Chicken Chinese Sausage",
      localname: "กุนเชียงไก่",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10050005,
      name: "Chicken Breakfast Sausage",
      localname: "ไส้กรอกไก่",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15140001,
      name: "Egg Curd White",
      localname: "เต้าหู้หลอดขาว",
      item_group: 1514,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 15140002,
      name: "Egg Tube Bean Curd",
      localname: "เต้าหู้หลอดไข่",
      item_group: 1514,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 16000001,
      name: "French Fries 3/8 (2kg./pack)",
      localname: "เฟร้นฟราย 3/8 (2กก./ถุง)",
      item_group: 1600,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000001,
      name: "Dorry Fish (Paific)",
      localname: "ปลาดอรี่",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030001,
      name: "Mixed Vegetable 1kg.",
      localname: "ผักสามสีแช่แข็ง 1 กก.",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030002,
      name: "Garden Pea Prozen 1 kg.",
      localname: "ถั่วลันเตาแข่แข็ง 1 กก.",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030003,
      name: "Spinach Frozen 1kg.",
      localname: "ผักโขมแช่แข็ง 1กก.",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030004,
      name: "Vegetabel Spring Roll",
      localname: "ปอเปี๊ยะผักเจ",
      item_group: 1203,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 10050006,
      name: "Bacon Louisiana 1kg./Pack",
      localname: "เบคอนหลุยเซียน่า 1กก./แพค",
      item_group: 1005,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030005,
      name: "Chicken Roll",
      localname: "ไก่จ๊อ",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010001,
      name: "Rhizome",
      localname: "กระชาย",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010002,
      name: "Garlic Peeled",
      localname: "กระเทียมแกะ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010003,
      name: "White Cabbage",
      localname: "กระหล่ำปลีขาว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010004,
      name: "Purple Cabbage",
      localname: "กระหล่ำปลีม่วง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010005,
      name: "Curcuma",
      localname: "ขมิ้นสด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010006,
      name: "Baby corn",
      localname: "ข้าวโพดอ่อน",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010007,
      name: "Corn Sweet",
      localname: "ข้าวโพดฝัก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010008,
      name: "Galingale",
      localname: "ข่าอ่อน",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010009,
      name: "Ginger Sliced",
      localname: "ขิงหั่นฝอย",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010010,
      name: "Kale Lettuce",
      localname: "ผักคะน้า",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010011,
      name: "Celery Local",
      localname: "คื่นฉ่าย",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010012,
      name: "Carrot",
      localname: "แครอท",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010013,
      name: "Cauliflower",
      localname: "ดอกกะหล่ำ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010014,
      name: "Spring Onion",
      localname: "ต้นหอม",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010015,
      name: "Lemongrass",
      localname: "ตะไคร้",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010016,
      name: "Cucumber",
      localname: "แตงกวา",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010017,
      name: "Hot Basil Leaf",
      localname: "ใบกระเพรา",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010018,
      name: "Sweet Basil",
      localname: "ใบโหระพา",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010019,
      name: "Kaffirlime Leaf",
      localname: "ใบมะกรูด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010020,
      name: "Canton Lettuce",
      localname: "ผักกวางตุ้ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010021,
      name: "Iceberg",
      localname: "ผักกาดแก้ว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010022,
      name: "Local Lettuce",
      localname: "ผักกาดหอม",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010023,
      name: "Thai Parsley",
      localname: "ผักชีไทย",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010024,
      name: "Parsley",
      localname: "ผักชีฝรั่ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010025,
      name: "Red Chilli Bird",
      localname: "พริกขี้หนูแดงเด็ด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010026,
      name: "Red Chilli",
      localname: "พริกชี้ฟ้าแดง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010027,
      name: "Young Pepper",
      localname: "พริกไทยอ่อน",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010028,
      name: "Pumpkin",
      localname: "ฟักทอง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010029,
      name: "Tomato",
      localname: "มะเขือเทศ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010030,
      name: "sweet pepper",
      localname: "พริกหยวก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010031,
      name: "Egg Plant Crisp",
      localname: "มะเขือเปราะ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010032,
      name: "Small Egg Plant",
      localname: "มะเขือพวงเด็ด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010033,
      name: "Long Egg Plant",
      localname: "มะเขือยาว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010034,
      name: "Lime",
      localname: "มะนาว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010035,
      name: "Potato",
      localname: "มันฝรั่ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010036,
      name: "Shallot",
      localname: "หอมแดงพม่าแกะ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010037,
      name: "Onion",
      localname: "หอมใหญ่",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010038,
      name: "Turnip",
      localname: "หัวไชเท้า",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010039,
      name: "Shiitake Fresh",
      localname: "เห็ดหอมสด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010040,
      name: "Red Oak",
      localname: "เรดโอ๊ค",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010041,
      name: "Green Oak",
      localname: "กรีนโอ๊ก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010042,
      name: "Frillice Ice burg Lettuce",
      localname: "ฟินเลย์ ไอเบิร์ก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010043,
      name: "Romains Lettuce",
      localname: "โรแมนคอส",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010044,
      name: "Radicchio Lettuce",
      localname: "เรดิชชิโอ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010045,
      name: "Bell Pepper Red",
      localname: "พริกยักษ์แดง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010046,
      name: "Bell Pepper Yellow",
      localname: "พริกยักษ์เหลือง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010047,
      name: "Bell Pepper Green",
      localname: "พริกยักษ์เขียว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010048,
      name: "Cherry Tomato",
      localname: "มะเขือเทศราชินี",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010049,
      name: "Celery Import",
      localname: "คึ่นฉ่ายฝรั่ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010050,
      name: "Thyme Fresh",
      localname: "ใบทามส์สด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010051,
      name: "Yellow Bean Curd",
      localname: "เต้าหู้เหลืองแผ่น",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010052,
      name: "white lettuce",
      localname: "ผักกาดขาว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010053,
      name: "Small cucumber",
      localname: "แตงกวาเล็ก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010001,
      name: "Coconut Milk 1L.",
      localname: "กะทิกล่อง 1 ลิตร",
      item_group: 1501,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 12010054,
      name: "Frillice Ice burg Lettuce",
      localname: "ฟินเลย์ ไอเบิร์ก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010055,
      name: "Broccoli",
      localname: "บล็อคโคลี่",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010056,
      name: "Green Chilli Bird",
      localname: "พริกขี้หนูเขียวเด็ด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010057,
      name: "Red Radish",
      localname: "เรดเรดิช",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010058,
      name: "Green goat pepper",
      localname: "พริกชีฟ้าเขียว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010059,
      name: "Beetroot",
      localname: "บีทรูท",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010060,
      name: "Eryngii",
      localname: "เห็ดออรินจิ (ถุงละ 1กก.)",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010061,
      name: "Sunflower Sprouts",
      localname: "ต้นอ่อนทานตะวัน",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010062,
      name: "Garlic Leek",
      localname: "ต้นกระเทียม",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010063,
      name: "Fresh Rosemarry",
      localname: "โรสแมรี่สด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010002,
      name: "Soybean",
      localname: "ถั่วเหลือง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15050001,
      name: "Curry red krati",
      localname: "เครื่องแกงกะทิ",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15050002,
      name: "Green Curry Paste",
      localname: "เครื่องแกงเขียวหวาน",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15100001,
      name: "Pomace Olive Oil 5L.",
      localname: "น้ำมันมะกอกธรรมชาติ โพแมซ 5ลิตร",
      item_group: 1510,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15010003,
      name: "Whole Green Olive",
      localname: "มะกอกเขียวไม่มีเมล็ด",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010004,
      name: "Whole Pitted Black Olive",
      localname: "มะกอกดำไม่มีเมล็ด",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15100002,
      name: "Palm Oil 18 Liters",
      localname: "น้ำมันพืช 18 ลิตร",
      item_group: 1510,
      InventoryUnit: "TANK",
      OrderUnit: "TANK",
    },
    {
      Code: 15100003,
      name: "Salad Oil 3.3 L.",
      localname: "น้ำมันสลัด ขนาด 3.3 ลิตร",
      item_group: 1510,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15100004,
      name: "Sesame Oil",
      localname: "น้ำมันงา",
      item_group: 1510,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010005,
      name: "Dried Leave Thyme",
      localname: "ใบทาร์มแบบแห้ง",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010006,
      name: "Oregano 141 g.",
      localname: "ออริกาโน่ 141 กรัม",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010007,
      name: "Bay Leave",
      localname: "ใบเบย์",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010008,
      name: "Cinamon Stick",
      localname: "อบเชย",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010009,
      name: "Dried Leave Rosemarry",
      localname: "ใบโรสแมรี่แห้ง",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010010,
      name: "Pepper Seed",
      localname: "เม็ดพริกไทยดำ",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010011,
      name: "Chilli Powder 500g./pack",
      localname: "พริกป่น 500 กรัม / ถุง",
      item_group: 1501,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010012,
      name: "Fried Garlic",
      localname: "กระเทียมเจียว",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010013,
      name: "Onion Render",
      localname: "หอมแดงเจียว",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010014,
      name: "Curry powder",
      localname: "ผงกะหรี่",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010015,
      name: "Star anise",
      localname: "โป๊ยกั๊ก",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15020001,
      name: "Spaghetti (1*5)",
      localname: "เส้นสปาเก็ตตี้ (1*5)",
      item_group: 1502,
      InventoryUnit: "KG",
      OrderUnit: "BOX5",
    },
    {
      Code: 15020002,
      name: "Penne Rigate 500g.",
      localname: "เส้นเพนเน่ริกาเต้ 500กรัม.",
      item_group: 1502,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15030001,
      name: "Rice Noodle 500g.",
      localname: "วุ้นเส้น 500 กรัม",
      item_group: 1503,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15030002,
      name: "Noodle Large",
      localname: "ก๋วยเตี๋ยวเส้นใหญ่",
      item_group: 1503,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15030003,
      name: "Yellow Noodle",
      localname: "บะหมี่เหลือง",
      item_group: 1503,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15030004,
      name: "Sapum Noodle",
      localname: "หมี่สะปำ",
      item_group: 1503,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15130001,
      name: "Sticky Rice",
      localname: "ข้าวเหนียว",
      item_group: 1513,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010016,
      name: "Muesli 1 kg.",
      localname: "มูสลี่ 1 กิโล",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15030005,
      name: "Rice Vermicilli / Pack",
      localname: "หมี่หุ้นแห้ง / ห่อ",
      item_group: 1503,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15030006,
      name: "Ma Ma FF 500g.",
      localname: "บะหมี่กึ่งสำเร้จรูป FF 500กรัม",
      item_group: 1503,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15020003,
      name: "Pasta Fettuccine Egg 1kg.",
      localname: "พาสต้า เฟตตูชินี่ไข่ 1kg",
      item_group: 1502,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15020004,
      name: "Macaroni",
      localname: "เส้นมักกะโรนี ข้องอ",
      item_group: 1502,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15020005,
      name: "Pasta Spaghetti Ticinella 1kg.",
      localname: "พาสต้า สปาเก็ตตี้ ทีซีเนลล่า 1 กิโล",
      item_group: 1502,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15020006,
      name: "Pasta Fusilli Tricolore 1kg.",
      localname: "พาสต้า ฟูลซิลลี่ 3 สี 1กิโล",
      item_group: 1502,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15130002,
      name: "Rice 40 KG.",
      localname: "ข้าวหอม ตราฉัตรม่าง 40 กก.",
      item_group: 1513,
      InventoryUnit: "KG",
      OrderUnit: "SACK(40KG)",
    },
    {
      Code: 15130003,
      name: "Barley",
      localname: "ข้าวบาร์เลย์",
      item_group: 1513,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15020007,
      name: "Fusilli 500g.",
      localname: "พาสต้าเกลียว 500 กรัม",
      item_group: 1502,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15010017,
      name: "Dried Yellow Raisin",
      localname: "ลูกเกดสีเหลือง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010018,
      name: "Dried Black Raisin",
      localname: "ลูกเกดสีดำ",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010019,
      name: "Almond Slice",
      localname: "อัลมอนด์สไลด์",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010020,
      name: "Kidney Bean 500g./pack",
      localname: "ไร่ทิพย์ ถั่วแดงหลวง 500กรัม / ถุง",
      item_group: 1501,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010021,
      name: "Cantaloupe Dried",
      localname: "แคนตาลูปแห้ง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010022,
      name: "Papaya Dried",
      localname: "มะละกอแห้ง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010023,
      name: "Pineapple Dried",
      localname: "สับปะรดแห้ง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010024,
      name: "Peeled Raw Peanut",
      localname: "ถั่วลิสงแกะเปลือก(ถั่วจีน)",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010025,
      name: "Capers In Brine  245 g",
      localname: "แคปเปอร์ในน้ำสายชู ซีส 245 กรัม",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 16020001,
      name: "Indian Curry Cickpeas 1kg./pack",
      localname: "แกงถั่วลูกไก่อินเดีย 1 กก/แพค",
      item_group: 1602,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010026,
      name: "Chickpeas",
      localname: "ถั่วลูกไก่",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040001,
      name: "Tempura Flour 500g.",
      localname: "แป้งทอดกรอบ 500 กรัม",
      item_group: 1504,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010027,
      name: "Bread Crumbs",
      localname: "เกล็ดขนมปัง",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15120001,
      name: "Knor Aromat",
      localname: "อโรมาต ตราคนอร์",
      item_group: 1512,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15120002,
      name: "Knorr Cream Soup Base",
      localname: "ครีมซุปเบส ตราคนอร์",
      item_group: 1512,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15120003,
      name: "Knorr Brown Sauce 1 Kg.",
      localname: "บราวน์ซอส 1 กก.",
      item_group: 1512,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15120004,
      name: "Tabasco Hot Pepper",
      localname: "ซอสเผ็ด(ทาบาสโก้)",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15110001,
      name: "Tomato Ketchup Sauce 5000 ml.",
      localname: "ซอสมะเขือเทศ 5,000 มล.",
      item_group: 1511,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15110002,
      name: "Chilli Sauce 5 kg.(1*2)",
      localname: "ซอสพริกตราคนอร์ 5 กก.(1*2)",
      item_group: 1511,
      InventoryUnit: "GAL",
      OrderUnit: "GAL2",
    },
    {
      Code: 15110003,
      name: "Oyster Sauce 5,000 ml.",
      localname: "น้ำมันหอยนางรม 5,000 มล.",
      item_group: 1511,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15120005,
      name: "Fish Sauce 4,500 ml.",
      localname: "น้ำปลา 4,500 มล.",
      item_group: 1512,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15120006,
      name: "Chicken Dipping Sauce 4,300g.",
      localname: "น้ำจิ้มไก่คนอร์ 4,300 กรัม",
      item_group: 1512,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15110004,
      name: "Tamarind Juice",
      localname: "น้ำมะขามเปียก",
      item_group: 1511,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15110005,
      name: "Tomato Paste MIGA",
      localname: "ซอสมะเขือเทศเข้มข้น",
      item_group: 1511,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15010028,
      name: "Whole Peeled Tomatoes",
      localname: "มะเขือเทศทั้งลูกในน้ำ",
      item_group: 1501,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15010029,
      name: "Baked Beans In Tomato Sauce",
      localname: "ถั่วขาวในซอสมะเขือเทศ",
      item_group: 1501,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 14010001,
      name: "White Mayonnaise 1 kg.",
      localname: "มายองเนส 1 กก.",
      item_group: 1401,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15120007,
      name: "White Soy Sauce Formula 700ml.",
      localname: "ซีอิ๊วขาวเด็กสมบูรสูตร1  700 มล.",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15120008,
      name: "Salt 1kg.",
      localname: "เกลือป่น ปรุงทิพย์ 1กก.",
      item_group: 1512,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15120009,
      name: "White Pepper Powder",
      localname: "พริกไทยขาวป่น",
      item_group: 1512,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15120010,
      name: "Vinegar 5L.",
      localname: "น้ำส้มสายชู 5 ลิตร",
      item_group: 1512,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15010030,
      name: "Cornichons",
      localname: "แตงกวาดอง",
      item_group: 1501,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15060001,
      name: "Kokokrunch 330g.",
      localname: "โกโก้ครั้น ขนาด 330 กรัม",
      item_group: 1506,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15060002,
      name: "Corn Flakes 275g",
      localname: "คอร์นแฟลก ขนาด 275 กรัม",
      item_group: 1506,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15120011,
      name: "Mae Prenom Chilli Oil 3KG.",
      localname: "น้ำพริกเผาแม่ประนอม 3กก.",
      item_group: 1512,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15010031,
      name: "Roasted Seaweed / pack",
      localname: "แผ่นสาหร่ายห่อข้าว / ห่อ",
      item_group: 1501,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15010032,
      name: "Green Seaweed - Soup, Salad 100g.",
      localname: "สาหร่ายวากาเมะซุปแผ่นเล็ก 100 กรัม",
      item_group: 1501,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 15010033,
      name: "Pickle Ginger Sliced 1.6 kg",
      localname: "ขิงดอง1.6กก.",
      item_group: 1501,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15120012,
      name: "Maggi Sauce 100ml.",
      localname: "ซอสแม็กกี่ 100มล.",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15120013,
      name: "Basalmic Vinegar 500g.",
      localname: "น้ำส้มสายชูหมักบัลซามิค 500 กรัม",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15110006,
      name: "Sweet Plum Sauce 780g.",
      localname: "น้ำจิ้มบ๊วย 780 กรัม",
      item_group: 1511,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15110007,
      name: "Dijon Mustatd 440G.",
      localname: "มัสตาร์ดดิจอง 440 กรัม",
      item_group: 1511,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15060003,
      name: "Honey Stars 300g.",
      localname: "ฮันนี่สตาร์ส ซีเรียล 300g.",
      item_group: 1506,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15120014,
      name: "Teriyaki Sauce",
      localname: "ซอสเทอริยากิ",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15120015,
      name: "Red Wine Vinegar 500 ml.",
      localname: "น้ำส้มสายชูหมักจากไวน์แดง 500มล.",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15120016,
      name: "Seasoning Sauce golden mountain 1000 ml.",
      localname: "ซอสปรุงรส ฝาเขียว 1000 มล.",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15000001,
      name: "Creamer Nestle ABF 450g.",
      localname: "เนสท์เล่ ครีมเมอร์ 450 กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000002,
      name: "Nestle Chocolate Star ABF 900g.",
      localname: "เนสท์เล่ สตาร์ ช็อกโกแลตเย็น 900กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15090001,
      name: "Chocolate Topping Best food 1.2 kg.",
      localname: "ช็อคโกแลต ท็อปปิ้ง 1.2กก.",
      item_group: 1509,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15110008,
      name: "Pizza Sauce 1 kg.",
      localname: "ซอสพิซซ่า 1 กก.",
      item_group: 1511,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15000003,
      name: "Nescafe Alegria 200 g. ABF",
      localname: "เนสกาแฟ เอเลอเกรียผสมกาแฟคั่วบด 200กรัม ABF",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010034,
      name: "Cashew Nut",
      localname: "เม็ดมะม่วงหิมพานต์เต็มเม็ด",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15120017,
      name: "Fa Thai Flavor Powder 850g.",
      localname: "ผงปรุงรสฟ้าไทยรสเห็ดหอม 850 กรัม",
      item_group: 1512,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15000004,
      name: "Nestea Milk Tea ABF 600g.",
      localname: "เนสที ชานมเย็นปรุงสำเร็จชนิดผง 600กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15110009,
      name: "Dijon Mustatd 226G.",
      localname: "มัสตาร์ดดิจอง 226 กรัม",
      item_group: 1511,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15040002,
      name: "Multimalt Mix",
      localname: "แป้งมัลติมอลท์มิกซ์",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010035,
      name: "Miso 1 kg.",
      localname: "มิโซะ เต้าเจี้ยวญี่ปุ่น 1 กก.",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040003,
      name: "Corn Starch",
      localname: "แป้งข้าวโพด",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040004,
      name: "Cassava Starch",
      localname: "แป้งมันสำปะหลัง",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040005,
      name: "Pancake Mix",
      localname: "แป้งแพนเค้ก",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040006,
      name: "Popcake Mix",
      localname: "แป้งแพนเค็กผสมสำเร็จ",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15080001,
      name: "White Sugar 1 KG.",
      localname: "น้ำตาลทรายขาว 1 กิโล",
      item_group: 1508,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15080002,
      name: "Palm Sugar",
      localname: "น้ำตาลปิ๊บ",
      item_group: 1508,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15040007,
      name: "All-purpose Flour",
      localname: "แป้งว่าว 1 กก.",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15080003,
      name: "Rock Sugar",
      localname: "น้ำตาลกรวด",
      item_group: 1508,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15070001,
      name: "White Toast Bread 800g",
      localname: "ไวท์โทส 800 กรัม",
      item_group: 1507,
      InventoryUnit: "POND",
      OrderUnit: "POND",
    },
    {
      Code: 15070002,
      name: "White Toast Bread 1200g",
      localname: "ไวท์โทส 1200 กรัม",
      item_group: 1507,
      InventoryUnit: "POND",
      OrderUnit: "POND",
    },
    {
      Code: 15070003,
      name: "Italian Pizza  Frozen Par Baked (150 g) 12''",
      localname: "แผ่นแป้งพิซซ่า (150กรัม) 12 นิ้ว",
      item_group: 1507,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 15070004,
      name: "French Baguette 300 g.",
      localname: "เฟรนช บาเก็ต 300 กรัม",
      item_group: 1507,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 15070005,
      name: "Plain Croissant-Economic-30g",
      localname: "ครัวซองค์ 30 กรัม",
      item_group: 1507,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 15070006,
      name: "Cinnamon Roll-Traditional-30g",
      localname: "ชินนาม่อนโรล 30 กรัม",
      item_group: 1507,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 15070007,
      name: "Danish-Economic-30g",
      localname: "เดนิช 30 กรัม",
      item_group: 1507,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 15040008,
      name: "Imperial Brownie Mix 400g.",
      localname: "แป้งบราวนี่ อิมพีเรียล 400 กรัม",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15070008,
      name: "Whole Wheat Toast Bread -800 g",
      localname: "โฮลวีทโทส 800 กรัม",
      item_group: 1507,
      InventoryUnit: "POND",
      OrderUnit: "POND",
    },
    {
      Code: 15070009,
      name: "Muiti Grian Bread Loaf 600g",
      localname: "มัลติเกรน เบรด 600กรัม",
      item_group: 1507,
      InventoryUnit: "LOAF",
      OrderUnit: "LOAF",
    },
    {
      Code: 13000001,
      name: "Fresh Pineapple Juice 5L.",
      localname: "น้ำสับปะรด 5 ลิตร",
      item_group: 1300,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 13000002,
      name: "Fresh Guava Juice 5L.",
      localname: "น้ำฝรั่ง 5 ลิตร",
      item_group: 1300,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 12000001,
      name: "Banana",
      localname: "กล้วยหอม",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000002,
      name: "Green Apple",
      localname: "แอปเปิ้ลเขียว",
      item_group: 1200,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 12000003,
      name: "Kiwi",
      localname: "กีวี่",
      item_group: 1200,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 12000004,
      name: "Red Grape",
      localname: "องุ่นแดงนอกมีเมล็ด",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000005,
      name: "Dragon Fruit",
      localname: "แก้วมังกร",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000006,
      name: "Orange No.0",
      localname: "ส้มเขียวหวาน เบอร์ 0",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000007,
      name: "Orange No.1",
      localname: "ส้มเขียวหวาน เบอร์ 1",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000008,
      name: "Cantaloupe Sunlady",
      localname: "แคนตาลูปซันเลดี้",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000009,
      name: "Guava Seedless",
      localname: "ฝรั่งไร้เมล็ด",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000010,
      name: "Pineapple",
      localname: "สับปะรด กลาง",
      item_group: 1200,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 12000011,
      name: "Watermelon",
      localname: "แตงโม",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000012,
      name: "Banana Nam-wa variety",
      localname: "กล้วยน้ำว้า",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000013,
      name: "Holland Papaya",
      localname: "มะละกอฮอลแลนด์",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14000001,
      name: "Fresh Milk 5 L.",
      localname: "นมสด 5 ลิตร",
      item_group: 1400,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 13000003,
      name: "Fresh Orange Valencai Juice 5L.",
      localname: "น้ำส้มวาเลนเซีย 5 ลิตร",
      item_group: 1300,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 15010036,
      name: "Agar powder",
      localname: "ผงวุ้น",
      item_group: 1501,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 14020001,
      name: "Parmesan Block",
      localname: "พาเมซานก้อน",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14020002,
      name: "Mozzarella Cheese Shread",
      localname: "มอสซาเรลล่าชิส แท่ง",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14040001,
      name: "Plain Yoghurt 5 kg.",
      localname: "โยเกิร์ตธรรมชาติ 5 กก.",
      item_group: 1404,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 14010002,
      name: "Butter Allowrie 8 g. (Unsalted) 1*100",
      localname: "เนยตลับอลาวรี่ 8 กรัม จืด 1*100",
      item_group: 1401,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 14030001,
      name: "Anchor whipping Cream 1L.",
      localname: "วิปปิ้งครีมแองเคอร์ 1ลิตร",
      item_group: 1403,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 14010003,
      name: "Allowrie Fresh Butter 5Kg.(Unsalt)",
      localname: "อลาวรี่เนยจืด 5 กก.",
      item_group: 1401,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14020003,
      name: "Grated Parmesan Cheese",
      localname: "พาเมซานชีสชนิดผง",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15090002,
      name: "Jam Strawberry size 4.3 KG",
      localname: "แยมสตอเบอรี่ 4.3กก.",
      item_group: 1509,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15090003,
      name: "Jam Orange size 4.3KG",
      localname: "แยมส้ม 4.3กก.",
      item_group: 1509,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15090004,
      name: "Jam Pineapple size 4.3 KG",
      localname: "แยมสับปะรด 4.3กก.",
      item_group: 1509,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15080004,
      name: "Imperial Maple Syrup size 940g.",
      localname: "น้ำเชื่อมกลิ่นเมเปิ้ลอิมพีเรียล 940กรัม",
      item_group: 1508,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15080005,
      name: "Imperial Honey Syrup 670g.",
      localname: "น้ำผึ้งอิมพิเรียล 670 กรัม",
      item_group: 1508,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 13000004,
      name: "Malee Tangerine Orange Juice 200 ml.",
      localname: "มาลี น้ำส้มเขียวหวาน 200มล.",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15080006,
      name: "White sugar size 8 g.",
      localname: "น้ำตาลทรายขาว 8กรัม",
      item_group: 1508,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15080007,
      name: "Brown sugar size 8 g.",
      localname: "น้ำตาลทรายแดง 8กรัม",
      item_group: 1508,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15000005,
      name: "BOH English Breakfast Tea 2 g 1*100pcs.",
      localname: "BOH ชาโบ๊ อิงลิช เบรคฟาส 2กรัม 1*100ซอง",
      item_group: 1500,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 23010001,
      name: "La Vida Red Wine 5L.",
      localname: "ไวน์แดง 5ลิตร",
      item_group: 2301,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 23000001,
      name: "La Vida White Wine 5L.",
      localname: "ไวน์ขาว 5ลิตร",
      item_group: 2300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 10030001,
      name: "Duck Breast Grade A",
      localname: "อกเป็ดเกรดA",
      item_group: 1003,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030006,
      name: "Nuggets 1000 g.",
      localname: "นักเก็ตไก่ 1000 กรัม",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10000007,
      name: "Beef Rib Eye NZ",
      localname: "เนื้อสันแหลมนิวซีแลนด์",
      item_group: 1000,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10060001,
      name: "NZ Lamb Short Ribs",
      localname: "ซี่โครงแกะสั้นไม่แต่ง",
      item_group: 1006,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000002,
      name: "White Snapper Size 800-900 g.",
      localname: "ปลากระพงขาว ขนาด 800-900กรัม",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11020001,
      name: "Cuttle Fish",
      localname: "ปลาหมึกหอมใหญ่",
      item_group: 1102,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11040001,
      name: "NZ Half Shell Greenshell Mussel",
      localname: "หอยแมลงภู่ครึ่งฝา",
      item_group: 1104,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11020002,
      name: "Cuttle Fish size M",
      localname: "ปลาหมึกหอมกลาง",
      item_group: 1102,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11010003,
      name: "White Shrimp 30 pcs/kg.",
      localname: "กุ้งขาวใหญ่ 30 ตัว/กก.",
      item_group: 1101,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000003,
      name: "NW.Atlantic Salmon Fresh",
      localname: "ปลาแซลมอนตัวสด",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000004,
      name: "Snapper Size 500-600 g.",
      localname: "ปลากระพงขาว ขนาด 500-600 กรัม",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11010004,
      name: "White Shrimp 25 pcs/kg.",
      localname: "กุ้งขาวใหญ่เลี้ยง 25 ตัว/กก.",
      item_group: 1101,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000005,
      name: "NW.Atlantic Salmon Gutted Head On",
      localname: "ปลาแซลมอนแช่แข็ง",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12030007,
      name: "Chicken Satay",
      localname: "สะเต๊ะไก่",
      item_group: 1203,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010064,
      name: "Bean Sprout",
      localname: "ถั่วงอก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010065,
      name: "Green Chive Leaf",
      localname: "ใบกุ้ยฉ่าย",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010066,
      name: "Dill Fresh",
      localname: "ผักชีลาว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010067,
      name: "Shiitake Dry",
      localname: "เห็ดหอมแห้ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010068,
      name: "Zuchini",
      localname: "ซูชินี",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000014,
      name: "Sai Namphueng Orange",
      localname: "ส้มสายน้ำผึ้ง",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010069,
      name: "Dried Cayenne Pepper",
      localname: "พริกชี้ฟ้าแดงแห้ง",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010070,
      name: "Baby Carrot",
      localname: "เบบี้แครอท",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010071,
      name: "Edible Flower",
      localname: "ดอกไม้กินได้",
      item_group: 1201,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 14000002,
      name: "Carnation Sweetened Condenses 388g.",
      localname: "นมข้นหวานคาร์เนชั่น 388 กรัม",
      item_group: 1400,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15050003,
      name: "Pa Nang Curry",
      localname: "เครื่องแกงแพนง",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14050001,
      name: "Ice Cream Vanilla 3.3KG.",
      localname: "ไอกรีม รสวนิลลา 3.3 กก.",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050002,
      name: "Ice Cream Strawberry 3.3 KG",
      localname: "ไอศกรีม รสสตรอเบอรี่ 3.3 กก.",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050003,
      name: "Ice Cream Chocolate 3.3KG.",
      localname: "ไอกรีม รสช็อกโกแลต 3.3 กก.",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050004,
      name: "I/C Miki Miki Double Choco Stick",
      localname: "ไอศกรีม มิกิ มิกิ ดับเบิ้ลช็อกโก้ / แท่ง (1*60)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050005,
      name: "I/C Semanga Stick (1*50)",
      localname: "ไอศกรีม ซามังก้า / แท่ง (1*50)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050006,
      name: "I/C Markisa Stick (1*50)",
      localname: "ไอศกรีม มากีซา / แท่ง (1*50)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050007,
      name: "I/C Fruizzy Grape Stick (1*50)",
      localname: "ไอศกรีม ฟรุ๊ซซี่ เกรป / แท่ง (1*50)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050008,
      name: "I/C Nanas Stick (1*50)",
      localname: "ไอศกรีม นานาส / แท่ง (1*50)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050009,
      name: "I/C Mochi Chocolate (1*40)",
      localname: "ไอศกรีม โมจิ ช็อกโกแลต / อัน (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050010,
      name: "I/C Mochi Vanilla (1*40)",
      localname: "ไอศกรีม โมจิ วนิลลา / อัน (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050011,
      name: "I/C Mochi Durian (1*40)",
      localname: "ไอศกรีม ทุเรียน / อัน (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050012,
      name: "I/C Fruizzy Blueberry Yoghurt (1*40)",
      localname: "ไอศกรีม ฟรุ๊ตซี่ บลูเบอร์รี่โยเกิร์ต /แท่ง (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050013,
      name: "I/C Milk Melon Stick (1*40)",
      localname: "ไอศกรีม มิลค์เมล่อน / แท่ง (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050014,
      name: "I/C Strawberry Crispy Stick (1*40)",
      localname: "ไอศกรีม สตรอเบอร์รี่ คริสปี้ / แท่ง (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050015,
      name: "I/C Taro Crispy Stick (1*40)",
      localname: "ไอศกรีม ทาโร่คริสปี้ / แท่ง (1*40)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050016,
      name: "I/C Blueberry Cookies Stick (1*24)",
      localname: "ไอศกรีม บลูเบอร์รี่คุ๊กกี้ / แท่ง (1*24)",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 15030007,
      name: "Noodle Pad Thai",
      localname: "ก๋วยเตี๋ยวเส้นจันท์",
      item_group: 1503,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010037,
      name: "Sealect Tuna In Oil 185G.",
      localname: "ซีเล็คทูน่าในน้ำมันถั่วเหลือง 185 กรัม",
      item_group: 1501,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15120018,
      name: "Chinese Cooking Wine",
      localname: "เหล้าจีน",
      item_group: 1512,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15010038,
      name: "Wasabi Paste",
      localname: "วาซาบิสด",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15110010,
      name: "Pasta Sauce 1 Kg.",
      localname: "ซอสพาสต้า 1 กก.",
      item_group: 1511,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15110011,
      name: "BBQ Sauce 570 g.",
      localname: "ซอสบาร์บีคิว 570 กรัม",
      item_group: 1511,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15110012,
      name: "Tomato Ketchup Sauce 1*100",
      localname: "ซอสมะเขือเทศซอง 1*100",
      item_group: 1511,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 14000003,
      name: "Soy Milk / Kg.",
      localname: "น้ำนมถั่วเหลือง(เต้าหู้) / กก.",
      item_group: 1400,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15070010,
      name: "Ritz Cracker 300g.",
      localname: "แครกเกอร์ 300 กรัม",
      item_group: 1507,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 14000004,
      name: "Carnation Milk Unsweet 405G.",
      localname: "นมสดคาร์เนชั่น 405 กรัม",
      item_group: 1400,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15040009,
      name: "Farina Pizza Flour 1 Kg.",
      localname: "แป้งพิซซ่าฟาริน่า 1 กก.",
      item_group: 1504,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15070011,
      name: "Hamburger Bun-90g",
      localname: "แฮมเบอร์เกอร์ บัน 90 กรัม",
      item_group: 1507,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 14020004,
      name: "Cheese Cheddar sliced 81",
      localname: "เชดด้าชีสสไลด์ 81",
      item_group: 1402,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 14020005,
      name: "Feta Cheese 200 g.",
      localname: "เฟสต้าชีส 200 กรัม",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14030002,
      name: "Whipped Cream Sweetened in spray can 500g.",
      localname: "วิปปิ้งครีมหวานแบบสเปรย์ ขนาด 500กรัม",
      item_group: 1403,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 14030003,
      name: "Whipping Cream Spray 400 g. Anchior",
      localname: "วิปปิ้งครีมสเปรย์ ขนาด 400กรัม แองเคอร์",
      item_group: 1403,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 14020006,
      name: "Cheddar Cheese Block",
      localname: "เชดด้าชีสแท่ง",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14020007,
      name: "Mozzarella bufala in water (8pack/kg.)",
      localname: "มอสซาเรลล่าชีส ในน้ํา (8แพค/กก.)",
      item_group: 1402,
      InventoryUnit: "PACK",
      OrderUnit: "PACK",
    },
    {
      Code: 14020008,
      name: "Cheese Cheddar sliced 12",
      localname: "เชดด้าชีสสไลด์ 12",
      item_group: 1402,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 14030004,
      name: "Sour Cream  450 g .",
      localname: "ซาวครีม ครีมเปรี้ยว 450 กรัม",
      item_group: 1403,
      InventoryUnit: "CUP",
      OrderUnit: "CUP",
    },
    {
      Code: 14020009,
      name: "Allowrie Cheddar Cheese 1 kg.",
      localname: "สควีช 1กก. / ถุง",
      item_group: 1402,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14050017,
      name: "Gelato - Banana Choco",
      localname: "เจลาโต้ บานาน่าช็อกโก้",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050018,
      name: "Gelato - Bubble Gum",
      localname: "เจลาโต้ บับเบิ้ลกัมม์",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050019,
      name: "Gelato - Blueberry +Yogurt",
      localname: "เจลาโต้ บลูเบอร์รี่ โยเกิร์ต",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050020,
      name: "Gelato - Carmel",
      localname: "เจลาโต้ คาราเมล",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050021,
      name: "Gelato - Chocolate",
      localname: "เจลาโต้ ช็อกโกแลต",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050022,
      name: "Gelato - Cherry Berry",
      localname: "เจลาโต้ เชอร์รี่ เบอร์รี่",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050023,
      name: "Gelato - Yong Coconut",
      localname: "เจลาโต้ มะพร้าวน้ำหอม",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050024,
      name: "Gelato - Hokkaido Milk",
      localname: "เจลาโต้ นมฮอกไกโด",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050025,
      name: "Gelato - Mango",
      localname: "เจลาโต้ ข้าวเหนียวมะม่วง",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050026,
      name: "Gelato - Oreo+Milk Cream",
      localname: "เจลาโต้ โอริโอ้ นมครีม",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050027,
      name: "Gelato - Strawberry+Milk Cream",
      localname: "เจลาโต้ สตรอว์เบอร์รี่ นมครีม",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 14050028,
      name: "Gelato - Vanilla",
      localname: "เจลาโต้ วนิลา",
      item_group: 1405,
      InventoryUnit: "STICK",
      OrderUnit: "STICK",
    },
    {
      Code: 20010001,
      name: "Drinking Water Tank 18.9L.",
      localname: "น้ำดื่มถัง 18.9 ลิตร",
      item_group: 2001,
      InventoryUnit: "TANK",
      OrderUnit: "TANK",
    },
    {
      Code: 10010010,
      name: "Pork Leg",
      localname: "ขาหมู",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10010011,
      name: "Pork Leng",
      localname: "เล้งหมู",
      item_group: 1001,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020009,
      name: "Chicken Whole Sliced",
      localname: "ไก่ตัวสับ(แกง)",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020010,
      name: "Chicken Leg Boneless",
      localname: "น่องติดสะโพก",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 10020011,
      name: "Chicken Entrails",
      localname: "เครื่องในไก่",
      item_group: 1002,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000006,
      name: "Fresh Mackerel Cleaned",
      localname: "ปลาทุทำ",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000007,
      name: "Salted Fish Cut in Pieces",
      localname: "ปลาเค็มชิ้น(ปลาใบ)",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 11000008,
      name: "Mong Fish Sliced With Head",
      localname: "ปลามงสับหั่นชิ้นปนหัว",
      item_group: 1100,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010072,
      name: "Ginger",
      localname: "ขิงแก่",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010073,
      name: "Morning Glory",
      localname: "ผักบุ้งจีน",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010074,
      name: "Taro",
      localname: "เผือก",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010075,
      name: "Morrow",
      localname: "ฟักเขียว",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010076,
      name: "Bamboo Line",
      localname: "หน่อไม้เส้น",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010077,
      name: "Bitter Gourd",
      localname: "มะระ",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010039,
      name: "Dried Sweet Turnip",
      localname: "ไชโป้หวานฝอย",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010078,
      name: "Acacia (Cha-Om)",
      localname: "ชะอม",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010079,
      name: "Flower spring onion",
      localname: "ดอกหอม",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12010080,
      name: "Tree Basil",
      localname: "ใบรา",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15050004,
      name: "Sour Curry Paste",
      localname: "เครื่องแกงผัดเผ็ด",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15050005,
      name: "Sour Curry Paste",
      localname: "เครื่องแกงส้ม",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15130004,
      name: "Black Glutinous Rice 500g.",
      localname: "ข้าวเหนียวดำ ไร่ทิพย์ 500 กรัม",
      item_group: 1513,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010040,
      name: "Mung Bean",
      localname: "ถั่วเขียว",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15050006,
      name: "Shrimp Paste",
      localname: "กะปิแกง",
      item_group: 1505,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15000006,
      name: "Coffee Mate 450g.",
      localname: "คอฟฟี่เมต ขนาด 450 กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000007,
      name: "Ovaltin Powdwr 1000g.",
      localname: "โอวัลตินผง ขนาด 1000กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000008,
      name: "Nescafe Red Cup 600g.",
      localname: "เนสกาแฟ 600กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15010041,
      name: "canned fish",
      localname: "ปลากระป๋อง",
      item_group: 1501,
      InventoryUnit: "CAN",
      OrderUnit: "CAN",
    },
    {
      Code: 15080008,
      name: "Hale's Blue Boy Red",
      localname: "น้ำหวานเข้มข้น เอลบูลบอย แดง",
      item_group: 1508,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 12010081,
      name: "Mint Leaf",
      localname: "ใบสาระแหน่",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010042,
      name: "Butterfly pea 250 g.",
      localname: "ดอกอัญชันแห้ง 250 กรัม",
      item_group: 1501,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 12000015,
      name: "Young Coconut",
      localname: "มะพร้าวอ่อนปาดหัวปาดท้าย",
      item_group: 1200,
      InventoryUnit: "PCS",
      OrderUnit: "PCS",
    },
    {
      Code: 12010082,
      name: "Seedless Limes",
      localname: "มะนาวไร้เมล็ด",
      item_group: 1201,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 16030001,
      name: "Big Tube Ice",
      localname: "น้ำแข็งหลอดใหญ่",
      item_group: 1603,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 16030002,
      name: "Small Tube Ice",
      localname: "น้ำแข็งหลอดเล็ก",
      item_group: 1603,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010043,
      name: "Dry Roselle 1 kg.",
      localname: "กระเจียบอบแห้ง 1 กก.",
      item_group: 1501,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15010044,
      name: "Coconut Milk 500 ml.",
      localname: "กะทิกล่อง 500 มล.",
      item_group: 1501,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15080009,
      name: "Sugar Syrup 800 ml.",
      localname: "น้ำเชื่อมสำเร็จรูป 800 มล.",
      item_group: 1508,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000009,
      name: "Thai Tea Powder",
      localname: "ผงชาไทยตรามือ",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000010,
      name: "Nescafe Aromatico Roasted Coffee Bean 500g.(1*12)",
      localname: "NP เนสกาแฟเมล็ดกาแฟคั่ว อโรมาติโก้ลัง12/ 500 กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BOX12",
    },
    {
      Code: 15080010,
      name: "Brown Sugar 1 KG.",
      localname: "น้ำตาลทรายแดง 1 กก.",
      item_group: 1508,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 15080011,
      name: "Fine Granulated Brown Sugar 1 kg.",
      localname: "น้ำตาลทรายแดงชนิดเม็ดละเอียด 1 กก.",
      item_group: 1508,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 12000016,
      name: "Orange Mandarin",
      localname: "ส้มแมนดาริน",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 13000005,
      name: "Lime Juice 100%(Pasteurized) size 1L.",
      localname: "น้ำมะนาว100% พาสเจอร์ไรส์ 1 ลิตร",
      item_group: 1300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 12000017,
      name: "Fresh Passion Fruit",
      localname: "เสาวรสสด",
      item_group: 1200,
      InventoryUnit: "KG",
      OrderUnit: "KG",
    },
    {
      Code: 14000005,
      name: "MeJi 2000 Ml",
      localname: "นมจืด เมจิ 2000 มล.",
      item_group: 1400,
      InventoryUnit: "GAL",
      OrderUnit: "GAL",
    },
    {
      Code: 22000001,
      name: "Campari 75 cl",
      localname: "Campari 75 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000002,
      name: "Pernod  70 cl",
      localname: "Pernod  70 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000003,
      name: "Ricard  70 cl",
      localname: "Ricard  70 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000004,
      name: "Martini Extra dry  1000 cl",
      localname: "Martini Extra dry  1000 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000005,
      name: "Martini Rosso 1000 cl",
      localname: "Martini Rosso 1000 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000006,
      name: "Doilln Vemouth Blanc 75 cl",
      localname: "Doilln Vemouth Blanc 75 cl",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000007,
      name: "Lillet Blanc 75 cl.",
      localname: "Lillet Blanc 75 cl.",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22000008,
      name: "Lillet Rose 75 cl.",
      localname: "Lillet Rose 75 cl.",
      item_group: 2200,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22010001,
      name: "Tio Pepe 75 cl",
      localname: "Tio Pepe 75 cl",
      item_group: 2201,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22010002,
      name: "Taylor Special Ruby  75 cl",
      localname: "Taylor Special Ruby  75 cl",
      item_group: 2201,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22020001,
      name: "Hennessy V.S.O.P 70 cl",
      localname: "Hennessy V.S.O.P 70 cl",
      item_group: 2202,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22020002,
      name: "Martell V.S.O.P 70 cl",
      localname: "Martell V.S.O.P 70 cl",
      item_group: 2202,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22020003,
      name: "Grappa Bianco 75 cl",
      localname: "Grappa Bianco 75 cl",
      item_group: 2202,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030001,
      name: "Ballantine's finest 70 cl",
      localname: "Ballantine's finest 70 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030002,
      name: "Jack daniels 70 cl",
      localname: "Jack daniels 70 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030003,
      name: "John Jamson 70 cl",
      localname: "John Jamson 70 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030004,
      name: "Jim beam  70 cl  White Bourbon Whisky",
      localname: "Jim beam  70 cl  White Bourbon Whisky",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030005,
      name: "J&W Black lable 70 cl",
      localname: "J&W Black lable 70 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030006,
      name: "J&W Red lable 70 cl",
      localname: "J&W Red lable 70 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22040001,
      name: "Sang Som Lg 70 cl",
      localname: "Sang Som Lg 70 cl",
      item_group: 2204,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22040002,
      name: "Mekhong  Lg 70 cl",
      localname: "Mekhong  Lg 70 cl",
      item_group: 2204,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030007,
      name: "Chivas Regal 18 Yrs 70 cl.",
      localname: "Chivas Regal 18 Yrs 70 cl.",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030008,
      name: "Chivas Regal Mizunara 70 cl.",
      localname: "Chivas Regal Mizunara 70 cl.",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030009,
      name: "Wild Turkey Rye 75 cl",
      localname: "Wild Turkey Rye 75 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22030010,
      name: "Wild Turkey Bourton 75 cl",
      localname: "Wild Turkey Bourton 75 cl",
      item_group: 2203,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060001,
      name: "Gordon Dry 75 cl",
      localname: "Gordon Dry 70 cl",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060002,
      name: "Beefeater gin 75 cl",
      localname: "Beefeater gin 75 cl",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060003,
      name: "Bombay 75 cl",
      localname: "Bombay 75 cl",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060004,
      name: "Gin Beefeater 24 cl.",
      localname: "Gin Beefeater 24 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060005,
      name: "Gin Beefeater Pink 75 cl.",
      localname: "Gin Beefeater Pink 75 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060006,
      name: "Gin Monkey 47 Schwarzwald 50 cl.",
      localname: "Gin Monkey 47 Schwarzwald 50 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060007,
      name: "Gin Vine Floraison 70 cl.",
      localname: "Gin Vine Floraison 70 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060008,
      name: "Gin Stranger & Son 70 cl.",
      localname: "Gin Stranger & Sons 70 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060009,
      name: "Gin Mare 70 cl.",
      localname: "Gin Mare 70 cl.",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22050001,
      name: "Captain Morgan Black 75 cl",
      localname: "Captain Morgan Black 75 cl",
      item_group: 2205,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22050002,
      name: "Havana Club 3 Years 75 cl.",
      localname: "Havana Club 3 Years 75 cl.",
      item_group: 2205,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22050003,
      name: "Phoenix White Rum 70 Cl.",
      localname: "Phoenix White Rum 70 Cl.",
      item_group: 2205,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22050004,
      name: "Phoenix Dark Rum 70 Cl.",
      localname: "Phoenix Dark Rum 70 Cl.",
      item_group: 2205,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22050005,
      name: "Bacardi White 1 L.",
      localname: "Bacardi White 1 L.",
      item_group: 2205,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22080001,
      name: "Sierra Tequila  70 cl",
      localname: "Sierra Tequila  70 cl",
      item_group: 2208,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22080002,
      name: "El Matador Blanco Tequila 70 cl.",
      localname: "El Matador Blanco Tequila 70 cl.",
      item_group: 2208,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22070001,
      name: "Smirnoff Vodka 70 cl",
      localname: "Smirnoff Vodka 70 cl",
      item_group: 2207,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22070002,
      name: "Absolute Vodka 70 cl",
      localname: "Absolute Vodka 70 cl",
      item_group: 2207,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22070003,
      name: "Grey Goose Vodka 75 cl",
      localname: "Grey Goose Vodka 75 cl",
      item_group: 2207,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22070004,
      name: "Phoenix  Vodka 70 Cl.",
      localname: "Phoenix  Vodka 70 Cl.",
      item_group: 2207,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22080003,
      name: "Olmeca Gold Tequila 70 cl",
      localname: "Olmeca Gold Tequila 70 cl",
      item_group: 2208,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090001,
      name: "Bailey irish cream  70  CL",
      localname: "Bailey irish cream  70  CL",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090002,
      name: "Creme de Banana 75 cl",
      localname: "Creme de Banana 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090003,
      name: "Creme de Cacao White 75 cl",
      localname: "Creme de Cacao White 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090004,
      name: "Creme de Menthe Green 75 cl",
      localname: "Creme de Menthe Green 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090005,
      name: "Creme de Cassis 75 cl",
      localname: "Creme de Cassis 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090006,
      name: "Kahlua 70 cl",
      localname: "Kahlua 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090007,
      name: "Malibu Coconut 70 cl",
      localname: "Malibu Coconut 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090008,
      name: "Midori 70 cl",
      localname: "Midori 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090009,
      name: "Orange Curacao 75 cl",
      localname: "Orange Curacao 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090010,
      name: "Jagermeister 50 cl",
      localname: "Jagermeister 50 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090011,
      name: "Phoenix Triple Sec 70 cl",
      localname: "Phoenix Triple Sec 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090012,
      name: "Phoenix Blue Curacao 70 cl",
      localname: "Phoenix Blue Curacao 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090013,
      name: "Peach Schnapps 75 cl",
      localname: "Peach Schnapps 75 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22060010,
      name: "Phoenix Gin 70 cl",
      localname: "Phoenix Gin 70 cl",
      item_group: 2206,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090014,
      name: "Phoenix Peach 70 cl",
      localname: "Phoenix Peach 70 cl",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090015,
      name: "Phoenix  Cherry Brandy 70 Cl.",
      localname: "Phoenix  Cherry Brandy 70 Cl.",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090016,
      name: "Phoenix Orange Curacao 70 Cl.",
      localname: "Phoenix Orange Curacao 70 Cl.",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090017,
      name: "St. Germain 70 cl.",
      localname: "St. Germain 70 cl.",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090018,
      name: "Creme de Cacao Brown 75 cl.",
      localname: "Creme de Cacao Brown 75 cl.",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 22090019,
      name: "Aperol 70 cl.",
      localname: "Aperol 70 cl.",
      item_group: 2209,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 21000001,
      name: "Singha Beer Small Btl. 320 ml. (1*24)",
      localname: "เบียร์สิงห์ เล็ก 320 มล./ ขวด (1*24)",
      item_group: 2100,
      InventoryUnit: "BTL",
      OrderUnit: "BOX24",
    },
    {
      Code: 21000002,
      name: "Chang Beer Btl.320 ml.(1*24)",
      localname: "เบียร์ช้าง เล็ก 320 มล./ ขวด (1*24)",
      item_group: 2100,
      InventoryUnit: "BTL",
      OrderUnit: "BOX24",
    },
    {
      Code: 21010001,
      name: "Heineken small Btl. 330 ml.(1*24)",
      localname: "เบียร์ไฮเนเก้น เล็ก 330 มล./ ขวด (1*24)",
      item_group: 2101,
      InventoryUnit: "BTL",
      OrderUnit: "BOX24",
    },
    {
      Code: 21010002,
      name: "Corona Beer Btl. 330 ml.",
      localname: "เบียร์โคโรน่า 330 มล./ ขวด",
      item_group: 2101,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 20000001,
      name: "Fanta Orange 325 ml (1*24)",
      localname: "น้ำส้ม แฟนต้า 325 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000002,
      name: "Ginger Ale 330 ml. (1*24)",
      localname: "จินเจอร์เอล 330 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000003,
      name: "Soda Singha Onway 325 cc (1*24)",
      localname: "โซดาสิงห์วันเวย์ 325 cc. (1*24)",
      item_group: 2000,
      InventoryUnit: "BTL",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000004,
      name: "Diet Coke 325 ml. (1*24)",
      localname: "ไดเอทโค้ก 325 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000005,
      name: "Coke Can 325 ml. (1*24)",
      localname: "โค๊กกระป๋อง 325 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000006,
      name: "Sprite Can 325 ml. (1*24)",
      localname: "สไปรท์กระป๋อง 325 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20000007,
      name: "Schweppes Tonic  Can 325 ml. (1*24)",
      localname: "โทนิค 325 มล. (1*24)",
      item_group: 2000,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 20010002,
      name: "Perrier Sparkilng Water 330 ML.",
      localname: "เปอริเอ้ 330 มล.",
      item_group: 2001,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 20010003,
      name: "Minere Drinking Water 500 ml.(1*12)",
      localname: "มิเนเร่ 500 มล.(1*12)",
      item_group: 2001,
      InventoryUnit: "BTL",
      OrderUnit: "PACK12",
    },
    {
      Code: 20000008,
      name: "Gatorade 500 ml. Lime (1*12)",
      localname: "เกรเตอเรด 500 มล.กลิ่นมะนาว (1*12)",
      item_group: 2000,
      InventoryUnit: "BTL",
      OrderUnit: "PACK12",
    },
    {
      Code: 13000006,
      name: "Malee Pineapple Juice 1L.",
      localname: "มาลี น้ำสับปะรด 1 ลิตร",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 13000007,
      name: "Orange Juice Mandarin 1L.( Malee )",
      localname: "มาลี น้ำส้มแมนดาริน 1 ลิตร",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 13000008,
      name: "Doikham Mango Juice 1L.",
      localname: "ดอยคำ น้ำมะม่วง 1 ลิตร",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 13000009,
      name: "Cranberry Juice 1L.",
      localname: "น้ำแครนเบอร์รี่ 1ลิตร",
      item_group: 1300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 13000010,
      name: "Malee Apple Juice  1000 ml.",
      localname: "มาลี น้ำแอปเปิ้ล 1000 มล.",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX",
    },
    {
      Code: 15080012,
      name: "Red Grenadine Syrup Jumbo A",
      localname: "แกรนนาดีน สีแดง ตราจัมโบ้เอ",
      item_group: 1508,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15080013,
      name: "Curaco Blue Monin  700 ml.",
      localname: "โมนิน บลูครูราโซ่ ไซรัป 700 มล.",
      item_group: 1508,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 15000011,
      name: "BonCafe' Cafe Crema 250 g.",
      localname: "บอน กาแฟคั่วบดคาเฟ่ครีมา 250กรัม",
      item_group: 1500,
      InventoryUnit: "BAG",
      OrderUnit: "BAG",
    },
    {
      Code: 15000012,
      name: "Dilmah Earl Grey 2G.x25Tbags",
      localname: "ดิลมา ชาเอิร์ทเกย์ 2g.x25ซอง",
      item_group: 1500,
      InventoryUnit: "PCS",
      OrderUnit: "BOX25",
    },
    {
      Code: 15000013,
      name: "Dilmah Darjeeling 2G.x25Tbags",
      localname: "ดิลมา ชาดาร์จีลิง 2g.x25ซอง",
      item_group: 1500,
      InventoryUnit: "PCS",
      OrderUnit: "BOX25",
    },
    {
      Code: 15000014,
      name: "Dilmah Pure Camomile Flowers1.5 G.x25Tbags",
      localname: "ดิลมา ชากลิ่นคาโมมายล์ 1.5g.x25ซอง",
      item_group: 1500,
      InventoryUnit: "PCS",
      OrderUnit: "BOX25",
    },
    {
      Code: 15000015,
      name: "Dilmah English Breakfast 2G.x25Tbags",
      localname: "ดิลมา ชาอิงลิช เบรกฟาสต์ 2g.x25ซอง",
      item_group: 1500,
      InventoryUnit: "PCS",
      OrderUnit: "BOX25",
    },
    {
      Code: 15000016,
      name: "Dilmah Jasmins Green Tea 1.5G.x25Tbags",
      localname: "ดิลมา จัสมิน กรีนที 1.5g.x25ซอง",
      item_group: 1500,
      InventoryUnit: "PCS",
      OrderUnit: "BOX25",
    },
    {
      Code: 23030001,
      name: "SP/W Piccini Prosecco DOC",
      localname: "SP/W Piccini Prosecco DOC",
      item_group: 2303,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000002,
      name: "W/W Yellow tail Chardonnay",
      localname: "W/W Yellow tail Chardonnay",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000003,
      name: "W/W Hardys Nottage Hill Riesling",
      localname: "W/W Hardys Nottage Hill Riesling",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000004,
      name: "W/W Montes Limited Selection sauvignon Blanc",
      localname: "W/W Montes Limited Selection sauvignon Blanc",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000005,
      name: "W/W Gato Negro Moscato",
      localname: "W/W Gato Negro Moscato",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000006,
      name: "W/W Robert Mondavi Private Selection Chardonnay",
      localname: "W/W Robert Mondavi Private Selection Chardonnay",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23010002,
      name: "R/W Hardys Nottage Hill Cabernet Sauvignon",
      localname: "R/W Hardys Nottage Hill Cabernet Sauvignon",
      item_group: 2301,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23010003,
      name: "R/W Montes Limited Selection pinot Noir",
      localname: "R/W Montes Limited Selection pinot Noir",
      item_group: 2301,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23010004,
      name: "R/W Gato Negro Camenere",
      localname: "R/W Gato Negro Camenere",
      item_group: 2301,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23010005,
      name: "R/W Robert Mondavi Private Selection Cabernet Sauvignon",
      localname: "R/W Robert Mondavi Private Selection Cabernet Sauvignon",
      item_group: 2301,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23000007,
      name: "W/W Hard VR Chardonnay",
      localname: "W/W Hard VR Chardonnay",
      item_group: 2300,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23010006,
      name: "R/W Hard VR Cabernet Sauvignon",
      localname: "R/W Hard VR Cabernet Sauvignon",
      item_group: 2301,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 23020001,
      name: "RS/W Black Oak Zinfandel 2016",
      localname: "RS/W Black Oak Zinfandel 2016",
      item_group: 2302,
      InventoryUnit: "BTL",
      OrderUnit: "BTL",
    },
    {
      Code: 21000003,
      name: "Singha Beer Can 330 ml.(1*24)",
      localname: "เบียร์สิงห์ กระป๋อง 330 มล.(1*24)",
      item_group: 2100,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 21000004,
      name: "Chang Beer Can 320 ml.(1*24)",
      localname: "เบียร์ช้าง กระป๋อง 320 มล.(1*24)",
      item_group: 2100,
      InventoryUnit: "CAN",
      OrderUnit: "TRAY24",
    },
    {
      Code: 13000011,
      name: "Tipco Sai Nampueng Orange Juice 200 ml.(1*24)",
      localname: "ทิปโก้ น้ำส้มสายน้ำผึ้ง 200 มล.(1*24)",
      item_group: 1300,
      InventoryUnit: "BOX",
      OrderUnit: "BOX24",
    },
    {
      Code: 15150001,
      name: "Pringles Potato Crips Original 42g.(1*12)",
      localname: "พริงเกิลส์ มันฝรั่งทอดกรอบ รสดั้งเดิม 42กรัม (1*12)",
      item_group: 1515,
      InventoryUnit: "CAN",
      OrderUnit: "BOX12",
    },
    {
      Code: 15150002,
      name: "Pringles Sour Cream & Onion Flavor 42g. (1*12)",
      localname: "พริงเกิลส์ มันฝรั่งทอดกรอบ รสซาวครีมและหัวหอม 42กรัม (1*12)",
      item_group: 1515,
      InventoryUnit: "CAN",
      OrderUnit: "BOX12",
    },
    {
      Code: 15150003,
      name: "Lays Classic 40/42g.(1*6)",
      localname: "เลย์ คลาสสิค รสเกลือ 40/42กรัม (1*6)",
      item_group: 1515,
      InventoryUnit: "BAG",
      OrderUnit: "PACK6",
    },
    {
      Code: 15150004,
      name: "Tong Garden Salted Cashew Nuts 40g.(1*6)",
      localname: "ทองการ์เด้น เมล็ดมะม่วงหิมพานต์อบเกลือ 40กรัม (1*6)",
      item_group: 1515,
      InventoryUnit: "BAG",
      OrderUnit: "PACK6",
    },
    {
      Code: 15150005,
      name: "Tong Garden Salted Almonds 40g.(1*6)",
      localname: "ทองการ์เด้น อัลมอนด์อบเกลือ 40กรัม (1*6)",
      item_group: 1515,
      InventoryUnit: "BAG",
      OrderUnit: "PACK6",
    },
    {
      Code: 15150006,
      name: "Tong Garden Salted Peanuts 42g.(1*6)",
      localname: "ทองการ์เด้น ถั่วลิสงอบเกลือ 42กรัม (1*6)",
      item_group: 1515,
      InventoryUnit: "BAG",
      OrderUnit: "PACK6",
    },
    {
      Code: 15150007,
      name: "Ferrero Rocher T3(37.5gr.) (1*16)",
      localname: "เฟอเรโร รอชเชอร์ T3(37.5gr.) (1*16)",
      item_group: 1515,
      InventoryUnit: "PCS",
      OrderUnit: "PACK16",
    },
    {
      Code: 15150008,
      name: "Oreo Cookies Sandwich&Cream 28.5g./27.6g(1*12)",
      localname: "โอริโอ้ คุ๊กกี้แซนวิชแอนด์ครีม 28.5g./27.6g(1*12)",
      item_group: 1515,
      InventoryUnit: "PCS",
      OrderUnit: "PACK12",
    },
    {
      Code: 15150009,
      name: "Moo Sub Instant Noodles 60g.(1*6Cup)",
      localname: "บะหมี่กึ่งสำเร็จรูป รสหมูสับ 60กรัม (1*6กป.)",
      item_group: 1515,
      InventoryUnit: "CUP",
      OrderUnit: "PACK6",
    },
    {
      Code: 15150010,
      name: "Shrimp Tom Yum Instant Noodles 60g.(1*6Cup)",
      localname: "บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง 60กรัม (1*6กป.)",
      item_group: 1515,
      InventoryUnit: "CUP",
      OrderUnit: "PACK6",
    },
    {
      Code: 20010004,
      name: "Singha Drinking Water 500 ml.(1*24)",
      localname: "น้ำดื่มสิงห์ 500 มล. (1*24)",
      item_group: 2001,
      InventoryUnit: "BTL",
      OrderUnit: "BOX24",
    },
  ];

  const products_insert = [];

  for (const product of products) {
    const product_code = product.Code.toString().trim();
    const product_name = product.name;
    const product_localname = product.localname;
    const product_item_group = product_item_groups.find(
      (g) => g.code === product.item_group.toString()
    );
    const product_inventory_unit = units.find(
      (u) =>
        u.name.toUpperCase().trim() ===
        product.InventoryUnit.toString().toUpperCase().trim()
    );
    const product_order_unit = units.find(
      (u) =>
        u.name.toUpperCase().trim() ===
        product.OrderUnit.toString().toUpperCase().trim()
    );

    const item = {
      code: product_code,
      name: product_name,
      local_name: product_localname,
      product_item_group_id: product_item_group?.id || uuidv4(),
      inventory_unit_id: product_inventory_unit?.id || uuidv4(),
      inventory_unit_name: product_inventory_unit?.name || "",
      product_status_type: "active" as enum_product_status_type,
    };

    console.log(item);

    const find_product = await prisma_client.tb_product.findFirst({
      where: {
        name: product_name,
      },
    });

    if (find_product) {
      const update_product = await prisma_client.tb_product.update({
        where: {
          id: find_product.id,
        },
        data: {
          ...item,
          updated_at: new Date(),
          updated_by_id: by_id,
        },
      });

      console.log(`Updated product: ${product_name}`);
      products_insert.push(update_product);
    } else {
      const insert_product = await prisma_client.tb_product.create({
        data: {
          ...item,
          created_at: new Date(),
          created_by_id: by_id,
        },
      });

      if (insert_product) {
        console.log(`Inserted product: ${product_name}`);
        products_insert.push(insert_product);
      }
    }
  }

  console.log(`Processed ${products_insert.length} products`);
  return products_insert;
}

async function mock_delivery_point(by_id: string) {
  const delivery_points = [
    {
      name: "Main",
    },
  ];

  const delivery_points_insert = [];

  for (const delivery_point of delivery_points) {
    const delivery_point_name = delivery_point.name;

    const find_delivery_point = await prisma_client.tb_delivery_point.findFirst(
      {
        where: {
          name: delivery_point_name,
        },
      }
    );

    if (find_delivery_point) {
      const update_delivery_point =
        await prisma_client.tb_delivery_point.update({
          where: {
            id: find_delivery_point.id,
          },
          data: {
            name: delivery_point_name,
            is_active: true,
            updated_at: new Date(),
            updated_by_id: by_id,
          },
        });

      console.log(`Updated delivery point: ${delivery_point_name}`);
      delivery_points_insert.push(update_delivery_point);
    } else {
      const insert_delivery_point =
        await prisma_client.tb_delivery_point.create({
          data: {
            name: delivery_point_name,
            is_active: true,
            created_at: new Date(),
            created_by_id: by_id,
          },
        });

      console.log(`Inserted delivery point: ${delivery_point_name}`);
      delivery_points_insert.push(insert_delivery_point);
    }
  }

  console.log(`Processed ${delivery_points_insert.length} delivery points`);
  return delivery_points_insert;
}

async function mock_location(by_id: string) {
  const locations = [
    {
      Code: "MK01",
      Name: "Main Kitchen",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "MK02",
      Name: "ABF Kitchen",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "MK03",
      Name: "Bakery",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "SC01",
      Name: "Staff Canteen",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "FB01",
      Name: "Bar",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "BQ01",
      Name: "Banquet",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "MB01",
      Name: "Mini Bar",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "GC01",
      Name: "Grocery",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: true,
    },
    {
      Code: "OE01",
      Name: "OE Front Ofice",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE02",
      Name: "OE Spa",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE03",
      Name: "OE Housekeeping",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE04",
      Name: "OE Food & Beverage",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE05",
      Name: "OE Main Kitchen",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE06",
      Name: "OE Admin",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE07",
      Name: "OE Accounting",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE08",
      Name: "OE Human Resource",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE09",
      Name: "OE Sales & Marketing",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE10",
      Name: "OE Rooms-Housekeeping",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "OE11",
      Name: "OE Engineering",
      delivery_point: "Main",
      inventory_type: "inventory",
      physical_count_type: false,
    },
    {
      Code: "EX01",
      Name: "Exp - Front",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX02",
      Name: "Exp - Spa",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX03",
      Name: "Exp - Housekeeping",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX04",
      Name: "Exp - Food&Beverage",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX05",
      Name: "Exp - Main Kitchen",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX06",
      Name: "Exp - Admin",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX07",
      Name: "Exp - Accounting",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX08",
      Name: "Exp - Human Resource",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX09",
      Name: "Exp - Sales & Marketing",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX10",
      Name: "Exp - Engineering",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX11",
      Name: "Exp - Garden (Hotel)",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: true,
    },
    {
      Code: "EX12",
      Name: "Exp - Garden (5 Yak)",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: true,
    },
    {
      Code: "EX13",
      Name: "OC & ENT.",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX14",
      Name: "Complementary",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "EX15",
      Name: "Spoilage",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM01",
      Name: "REPAIR AND MAINTENANCE-FRONT",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM02",
      Name: "REPAIR AND MAINTENANCE-SPA",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM03",
      Name: "REPAIR AND MAINTENANCE-HOUSEKEEPING",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM04",
      Name: "REPAIR AND MAINTENANCE-FOOD AND BEVERAGE",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM05",
      Name: "REPAIR AND MAINTENANCE-MAIN KITCHEN",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: true,
    },
    {
      Code: "RM06",
      Name: "REPAIR AND MAINTENANCE-ADMIN",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM07",
      Name: "REPAIR AND MAINTENANCE-ACCOUNTING",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM08",
      Name: "REPAIR AND MAINTENANCE-HUMAN RESOURCE",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM09",
      Name: "REPAIR AND MAINTENANCE-SALES AND MARKETING",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
    {
      Code: "RM10",
      Name: "REPAIR AND MAINTENANCE-ENGINEERING",
      delivery_point: "Main",
      inventory_type: "direct",
      physical_count_type: false,
    },
  ];

  const locations_insert = [];

  for (const location of locations) {
    const location_name = location.Name;
    const location_delivery_point = location.delivery_point;

    const find_delivery_point = await prisma_client.tb_delivery_point.findFirst(
      {
        where: {
          name: location_delivery_point,
        },
      }
    );

    const find_location = await prisma_client.tb_location.findFirst({
      where: {
        name: location_name,
      },
    });

    if (find_location) {
      const update_location = await prisma_client.tb_location.update({
        where: {
          id: find_location.id,
        },
        data: {
          name: location_name,
          delivery_point_id: find_delivery_point?.id,
          delivery_point_name: location_delivery_point,
          location_type: location.inventory_type as enum_location_type,
          physical_count_type: location.physical_count_type ? "yes" : "no",
          updated_at: new Date(),
          updated_by_id: by_id,
        },
      });

      console.log(`Updated location: ${location_name}`);
      locations_insert.push(update_location);
    } else {
      const insert_location = await prisma_client.tb_location.create({
        data: {
          code: location_name,
          name: location_name,
          delivery_point_name: location_delivery_point,
          location_type: location.inventory_type as enum_location_type,
          physical_count_type: location.physical_count_type ? "yes" : "no",
          created_at: new Date(),
          created_by_id: by_id,
          ...(find_delivery_point?.id && {
            tb_delivery_point: {
              connect: { id: find_delivery_point.id }
            }
          })
        },
      });

      console.log(`Inserted location: ${location_name}`);
      locations_insert.push(insert_location);
    }
  }

  console.log(`Processed ${locations_insert.length} locations`);
  return locations_insert;
}

async function mock_department(by_id: string) {
  const departments = [
    {
      name: "Front Office",
    },
    {
      name: "Housekeeping",
    },
    {
      name: "Kitchen",
    },
    {
      name: "Food & Beverage",
    },
    {
      name: "Admin",
    },
    {
      name: "Accounting",
    },
    {
      name: "Human Resources",
    },
    {
      name: "Sales & Marketing",
    },
    {
      name: "Spa",
    },
    {
      name: "Engineering",
    },
  ];

  const departments_insert = [];

  for (const department of departments) {
    const department_name = department.name;

    const find_department = await prisma_client.tb_department.findFirst({
      where: {
        name: department_name,
      },
    });

    if (find_department) {
      const update_department = await prisma_client.tb_department.update({
        where: {
          id: find_department.id,
        },
        data: {
          name: department_name,
          is_active: true,
          updated_at: new Date(),
          updated_by_id: by_id,
        },
      });

      console.log(`Updated department: ${department_name}`);
      departments_insert.push(update_department);
    } else {
      const insert_department = await prisma_client.tb_department.create({
        data: {
          code: department_name,
          name: department_name,
          is_active: true,
          created_at: new Date(),
          created_by_id: by_id,
        },
      });

      console.log(`Inserted department: ${department_name}`);
      departments_insert.push(insert_department);
    }
  }

  console.log(`Processed ${departments_insert.length} departments`);
  return departments_insert;
}

async function mock_department_user(by_id: string) {
  const department_users = [
    {
      department: "Front Office",
      user_name: "test@test.com",
      is_hod: false,
    },
    {
      department: "Front Office",
      user_name: "user1@blueledgers.com",
      is_hod: true,
    },
    {
      department: "Front Office",
      user_name: "user2@blueledgers.com",
      is_hod: false,
    },
    {
      department: "Front Office",
      user_name: "user3@blueledgers.com",
      is_hod: false,
    },
    {
      department: "Admin",
      user_name: "user4@blueledgers.com",
      is_hod: false,
    },
    {
      department: "Accounting",
      user_name: "user5@blueledgers.com",
      is_hod: false,
    },
  ];

  const department_users_insert = [];

  for (const department_user of department_users) {
    const department_name = department_user.department;
    const user_name = department_user.user_name;
    const is_hod = department_user.is_hod;

    const find_department = await prisma_client.tb_department.findFirst({
      where: {
        name: department_name,
      },
    });

    const find_user = await prisma_platform.tb_user.findFirst({
      where: {
        username: user_name,
      },
    });
    // find user _ department
    const find_user_department =
      await prisma_client.tb_department_user.findFirst({
        where: {
          department_id: find_department?.id,
          user_id: find_user?.id,
        },
      });

    if (find_user_department) {
      const update_user_department =
        await prisma_client.tb_department_user.update({
          where: {
            id: find_user_department.id,
          },
          data: {
            department_id: find_department?.id,
            user_id: find_user?.id || "",
            is_hod: is_hod,
            updated_at: new Date(),
            updated_by_id: by_id,
          },
        });

      console.log(`Updated user department: ${department_name} - ${user_name}`);
      department_users_insert.push(update_user_department);
    } else {
      const insert_user_department =
        await prisma_client.tb_department_user.create({
          data: {
            department_id: find_department?.id || "",
            user_id: find_user?.id || "",
            is_hod: is_hod,
            created_at: new Date(),
            created_by_id: by_id,
          },
        });

      console.log(
        `Inserted user department: ${department_name} - ${user_name}`
      );
      department_users_insert.push(insert_user_department);
    }
  }
}

async function mock_vendor(by_id: string) {
  const vendors = [
    {
      name: "4 JOY SHOKUDO COMPANY LIMITED",
    },
    {
      name: "A K & J TEXTILE CO.,LTD.",
    },
    {
      name: "โรงเรียนบ้านกะตะ(ตรีทศยุทธอุปถัมภ์)",
    },
    {
      name: "ADISAK TRADING CO.,LTD.",
    },
    {
      name: "ADVANCE WIRELESS NETWORK CO.,LTD.",
    },
    {
      name: "ร้าน เอ็น เอส เอ็น ฮีท แอนด์เวอร์วิส(สำนักงานใหญ่)",
    },
    {
      name: "ร้านมังกี้สกรีนเสื้อ",
    },
    {
      name: "ร้านโชคอนันต์จักสาน (สำนักงานใหญ่) โดย นาย รัชชธีร์  ศรีธนสารวงศ์",
    },
    {
      name: "ร้านจักรคริยา",
    },
    {
      name: "เอ้กดี้เอ้ก",
    },
    {
      name: "เอทีวี ซีวิว ออน ทัวร์",
    },
    {
      name: "AMBROSE WINE CO.,LTD.",
    },
    {
      name: "ANDAMAN GAS CO.,LTD.",
    },
    {
      name: "Aqua Hotel Supply Co.,Ltd.",
    },
    {
      name: "AYOTHAYA LASER PHUKET CO.,LTD.",
    },
    {
      name: "เทศบาลเมืองป่าตอง",
    },
    {
      name: "เทศบาลตำบลกะรน",
    },
    {
      name: "B.GRIMM TECHNOLOGIES COMPANY LIMITED",
    },
    {
      name: "BANSUKAPUN AND MATERIALS CO.,LTD.",
    },
    {
      name: "BB SUPPLY AND SERVICE CO.,LTD.",
    },
    {
      name: "BIGMAN ELECTRONIC CO., LTD",
    },
    {
      name: "BK NATURE TAURUS CO.,LTD.",
    },
    {
      name: "BLUE WATER PROEN CO.,LTD.",
    },
    {
      name: "BORRAE TRADING CO.,LTD.",
    },
    {
      name: "C.Y.INTER FOODS CO.,LTD.",
    },
    {
      name: "CANON MARKETING (THAILAND) CO.,LTD",
    },
    {
      name: "Canva",
    },
    {
      name: "CARNIVAL MAGIC CO.,LTD.",
    },
    {
      name: "CHAINARIS PHUKET ENGINEERING CO.,LTD.",
    },
    {
      name: "CHOOCHUAY TRADING  GROUP  CO.,LTD.",
    },
    {
      name: "COMANCHE INTERNATIONAL CO.,LTD.",
    },
    {
      name: "COMPLETE ELECTRICAL SOLUTIONS CO.,LTD",
    },
    {
      name: "CYBER SYSTEM SERVICE CO.,LTD.",
    },
    {
      name: "D CONNEC TECHONOLOGY CO.,LTD,",
    },
    {
      name: "D.M.C PHUKET SOLUTION CO.,LTD.",
    },
    {
      name: "DOY FRESH -นาง ศวิตา  อภัยรัตน์",
    },
    {
      name: "DUTCH MILL CO.,LTD.",
    },
    {
      name: "EARNMART LTD.,PART.",
    },
    {
      name: "EKARAT ENGINEERING PUBLIC CO.,LTD.",
    },
    {
      name: "ELEPHANT JUNGLE SANCTUARY CO.,LTD.",
    },
    {
      name: "ENGINEERING 2 INSPECTOR CO.,LTD.",
    },
    {
      name: "สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดภูเก็ต",
    },
    {
      name: "สำนักงานทนายความเนติวิทย์ ภูเก็ต",
    },
    {
      name: "EXPRESS DATA CO.,LTD.",
    },
    {
      name: "EZEE TECHNOSYS PVT.,LTD.",
    },
    {
      name: "FOODMATIC CO.,LTD.",
    },
    {
      name: "G&A SUPPLY PART.,LTD.",
    },
    {
      name: "GRAPHO DESIGN CO.,LTD.",
    },
    {
      name: "HOTELIERS DOT GURU ( THAILAND ) CO.,LTD.",
    },
    {
      name: "I AM PREMIUM CO.,LTD.",
    },
    {
      name: "IDEAS A SAS COMPANY",
    },
    {
      name: "JARDINE SCHINDLER ( THAI ) LTD.",
    },
    {
      name: "JAROENWONGMEESUP CO.,LTD.",
    },
    {
      name: "KEEHIN TRADING CO.,LTD.",
    },
    {
      name: "KIATSIN STATIONERY CO.,LTD.",
    },
    {
      name: "KINGART ADVERTISING CO.,LTD.",
    },
    {
      name: "LAGUNA HOSPITALITY LIMITED",
    },
    {
      name: "MILLENIUM VENTURE SAMUI CO.,LTD.",
    },
    {
      name: "MISS PIKUL PHITYA-ISARAKUL",
    },
    {
      name: "MISS PIMPA PHITYA-ISARAKUL",
    },
    {
      name: "MR BOONLERT RAENGKLA ( NLN Phuket Service Co., Ltd.)",
    },
    {
      name: "MR CHITPON KUNTAMMARAT",
    },
    {
      name: "MR PARANYOO PHATKIM",
    },
    {
      name: "MR PRAKOB DABPECH",
    },
    {
      name: "MR SUKRIT VETCHAKUL (POLICE)",
    },
    {
      name: "MRS CHARINTHIP CHAITHONGRAK",
    },
    {
      name: "Myhr Corporation Limited",
    },
    {
      name: "NABON INTER MEDICAL CO.,LTD.",
    },
    {
      name: "NAVASORN DISTRIBUTION CO.,LTD.",
    },
    {
      name: "Nonthasak Marine Co.,Ltd.",
    },
    {
      name: "NUMBER 1 DESIGN",
    },
    {
      name: "PanelesMatic Solutions Public Co.,Ltd.",
    },
    {
      name: "PATONG MART CO.,LTD.",
    },
    {
      name: "PAWINEE KHAKHO CO.,LTD.",
    },
    {
      name: "PETROLEUMTHAI COPORATION CO.,LTD.",
    },
    {
      name: "Petty Cash",
    },
    {
      name: "PHANG-NGA ATV ADVENTURE CO.,LTD.",
    },
    {
      name: "PHATTHANAKITSAHAKARN CO.,LTD.",
    },
    {
      name: "Phuket  ATV Tour Co.,Ltd.",
    },
    {
      name: "PHUKET AMORNPHAN CO.,LTD.",
    },
    {
      name: "PHUKET BAKERY SUPPLY LTD.,PART.",
    },
    {
      name: "PHUKET BEST SEA MARINE CO.,LTD.",
    },
    {
      name: "Phuket Cable Co.,Ltd",
    },
    {
      name: "PHUKET CHEMICAL AND SUPPLY CO., LTD.",
    },
    {
      name: "PHUKET CHEMICAL AND SUPPLY CO., LTD.",
    },
    {
      name: "PHUKET COLOUR SCREEN AND EMBROIDERY",
    },
    {
      name: "PHUKET ENVIRONMENTAL SERVICES CO.,LTD.CO.,LTD.",
    },
    {
      name: "PHUKET FANTA SEA (PUBLIC) CO.,LTD.",
    },
    {
      name: "PHUKET HAI SOOK HOLIDAY CO.,LTD.",
    },
    {
      name: "PHUKET KEEHIN ELECTRIC CO.,LTD.",
    },
    {
      name: "PHUKET PREMIUM GOODS CO.,LTD.",
    },
    {
      name: "PHUKET PROVICIAL AMINISTRATIVE ORGANIZATION",
    },
    {
      name: "PHUKET SANGUAN PANICH LTD.,PART.",
    },
    {
      name: "PHUKET SWIMMINGPOOL EQUIPMENT CO.,LTD.",
    },
    {
      name: "PHUKET TIENTHONG CO.,LTD.",
    },
    {
      name: "PHUKET TOURIST ASSOCIATION",
    },
    {
      name: "PISA HOTELSUPPLY CO., LTD.",
    },
    {
      name: "POWER-TECH CONTROL (THAILAND) CO.,LTD.",
    },
    {
      name: "PP BOOK AND COM CO.,LTD.",
    },
    {
      name: "PROVIDENT FUND",
    },
    {
      name: "PROVINCIAL ELECTRICITY AUTHORITY",
    },
    {
      name: "QUALITY FULL CO.,LTD.",
    },
    {
      name: "S.D.PHUKET COMPUTER CO.,LTD.",
    },
    {
      name: "SAFETY CENTER ( THAILAND ) CO.,LTD.",
    },
    {
      name: "SAHAROJ TEXTILE (1991) CO.,LTD.",
    },
    {
      name: "SAIFON SEAFOOD",
    },
    {
      name: "SANGDAMRONG CO.,LTD.",
    },
    {
      name: "Sawasdesing Lamp&Light Limited Partnership",
    },
    {
      name: "SEASTAR ANDAMAN CO., LTD",
    },
    {
      name: "Siam Kotchasan Conserve Co., Ltd.",
    },
    {
      name: "SIAM SURETY CO.,LTD.",
    },
    {
      name: "SINO-PACIFIC TRADING (THAILAND) CO.,LTD.",
    },
    {
      name: "SOUTH WEALTH GROUP CO.,LTD.",
    },
    {
      name: "SS Hospitality Co.,Ltd.",
    },
    {
      name: "STAFF",
    },
    {
      name: "SUDAWAN SEPTICTANKCLEANING PHUKET",
    },
    {
      name: "SUPER CHEAP CO.,LTD.CO.,LTD.",
    },
    {
      name: "SURAKIT DRINKING WATER LTD.,PART",
    },
    {
      name: "SUWANJATUPORN CO.,LTD.",
    },
    {
      name: "T-OIL SUPPLY CO.,LTD.",
    },
    {
      name: "THAI HOTELS ASSOCIATION",
    },
    {
      name: "THE VILLAGE MANAGEMENT CO.,LTD.",
    },
    {
      name: "THONGTHAWEEMOOKDAMAS ALUMINUM",
    },
    {
      name: "TOT PUBLIC COMPANY LIMITED",
    },
    {
      name: "TOURISM AUTHORITY OF THAILAND",
    },
    {
      name: "TRIPLE C. TRADING LTD.,PART.",
    },
    {
      name: "TRIPLE V ORANGE CO.,LTD.",
    },
    {
      name: "TRIPTEASE SINGAPORE PTE.,LTD.",
    },
    {
      name: "TRUE MOVE H UNIVERSAL COMMUNICATION",
    },
    {
      name: "UTECHPHUKET CO.,LTD.",
    },
    {
      name: "V.R.S. PHUKETFRUIT CO.,LTD.",
    },
    {
      name: "VANA NAVA CO.,LTD.",
    },
    {
      name: "VIRIYAH INSURANCE CO.,LTD.",
    },
    {
      name: "WEB CONNECTION CO.,LTD.",
    },
    {
      name: "YUENYONG ELECTRIC LTD.,PART.",
    },
    {
      name: "กรมสรรพสามิต",
    },
    {
      name: "ณะโม เอ็มแอนด์อี อีควิปเม้นท์",
    },
    {
      name: "น.ส.มัลลิกา จันทร์แดง (ร้านทองใบ กะตะซักรีด)",
    },
    {
      name: "นาย มงคลศักดิ์ พูลอินทร์",
    },
    {
      name: "นาย วิริยะ  แว่นนาค",
    },
    {
      name: "นาย อนุชา สุญาณวนิชกุล",
    },
    {
      name: "นายประสงค์ แซ่ตัน",
    },
    {
      name: "บริษัท แมททีเรียลเวิลด์ จำกัด",
    },
    {
      name: "บริษัท แสงชัยแมคโครวัสดุภัณฑ์ จำกัด",
    },
    {
      name: "บริษัท เอ-วัน ฟู้ดโปรดักส์ จำกัด",
    },
    {
      name: "บริษัท เอโซลาร์ คอร์ปอเรชั่น จำกัด",
    },
    {
      name: "บริษัท เอส เค จี เอฟ เทรดดิ้ง(2002)จำกัด",
    },
    {
      name: "บริษัท รักษาความปลอดภัย พีซีเอส และ ฟาซิลิตี้ เซอร์วิสเซส จำกัด",
    },
    {
      name: "บริษัท ภูเก็ต อี๊ฟส์ ทัวร์ จำกัด",
    },
    {
      name: "บริษัท เติมพลัง บริการ จำกัด",
    },
    {
      name: "บริษัท แบรนด์สแคปเปอร์ จำกัด",
    },
    {
      name: "บริษัท หมิงโฮเทล ซัพพลาย จำกัด",
    },
    {
      name: "บริษัท สกายเวิลด์ แอดเวนเจอร์ จำกัด",
    },
    {
      name: "บริษัท อินฟินีตี้ ลอนดรี จำกัด",
    },
    {
      name: "บริษัท ลีลาผ้าม่าน ภูเก็ต จำกัด",
    },
    {
      name: "บริษัท ไรท์ เฮียร์ จำกัด",
    },
    {
      name: "บริษัท พี.เค.อินเตอร์คราฟท์ จำกัด",
    },
    {
      name: "บริษัท ฟูเฉิง ฟู้ด จำกัด",
    },
    {
      name: "บมจ.ธนาคารกสิกรไทยเพื่อบัญชีบัตรเครดิต",
    },
  ];

  const vendors_insert = [];

  for (const vendor of vendors) {
    const vendor_name = vendor.name;
    const find_vendor = await prisma_client.tb_vendor.findFirst({
      where: {
        name: vendor_name,
      },
    });

    if (find_vendor) {
      const update_vendor = await prisma_client.tb_vendor.update({
        where: {
          id: find_vendor.id,
        },
        data: {
          name: vendor_name,
          is_active: true,
          updated_at: new Date(),
          updated_by_id: by_id,
        },
      });

      console.log(`Updated vendor: ${vendor_name}`);
      vendors_insert.push(update_vendor);
    } else {
      const insert_vendor = await prisma_client.tb_vendor.create({
        data: {
          code: vendor_name,
          name: vendor_name,
          is_active: true,
          created_at: new Date(),
          created_by_id: by_id,
        },
      });

      console.log(`Inserted vendor: ${vendor_name}`);
      vendors_insert.push(insert_vendor);
    }
  }

  console.log(`Processed ${vendors_insert.length} vendors`);
  return vendors_insert;
}

async function mock_user_location(by_id: string) {
  const list_all_location = await prisma_client.tb_location.findMany();
  const list_all_user = await prisma_platform.tb_user.findMany();
  const user_locations_insert = [];

  for (const location of list_all_location) {
    for (const user of list_all_user) {
      const find_user_location = await prisma_client.tb_user_location.findFirst(
        {
          where: {
            user_id: user.id,
            location_id: location.id,
          },
        }
      );

      if (find_user_location) {
        const update_user_location =
          await prisma_client.tb_user_location.update({
            where: {
              id: find_user_location.id,
            },
            data: {
              user_id: user.id,
              location_id: location.id,
              updated_at: new Date(),
              updated_by_id: by_id,
            },
          });

        console.log(`Updated user location: ${user.id} - ${location.id}`);
        user_locations_insert.push(update_user_location);
      } else {
        const user_location = await prisma_client.tb_user_location.create({
          data: {
            user_id: user.id,
            location_id: location.id,
            created_at: new Date(),
            created_by_id: by_id,
          },
        });

        console.log(`Inserted user location: ${user.id} - ${location.id}`);
        user_locations_insert.push(user_location);
      }
    }
  }

  console.log(`Processed ${user_locations_insert.length} user locations`);
  return user_locations_insert;
}

async function mock_product_location(by_id: string) {
  const list_all_location = await prisma_client.tb_location.findMany();
  const list_all_product = await prisma_client.tb_product.findMany();

  const location_products_insert = [];

  for (const location of list_all_location) {
    for (const product of list_all_product) {
      const find_location_product =
        await prisma_client.tb_product_location.findFirst({
          where: {
            location_id: location.id,
            product_id: product.id,
          },
        });

      if (find_location_product) {
        const update_location_product =
          await prisma_client.tb_product_location.update({
            where: {
              id: find_location_product.id,
            },
            data: {
              location_id: location.id,
              location_name: location.name,
              product_id: product.id,
              product_name: product.name,
              updated_at: new Date(),
              updated_by_id: by_id,
            },
          });

        console.log(`Updated location product: ${location.id} - ${product.id}`);
        location_products_insert.push(update_location_product);
      } else {
        const location_product = await prisma_client.tb_product_location.create(
          {
            data: {
              location_id: location.id,
              location_name: location.name,
              product_id: product.id,
              product_name: product.name,
              created_at: new Date(),
              created_by_id: by_id,
            },
          }
        );

        console.log(
          `Inserted location product: ${location.id} - ${product.id}`
        );
        location_products_insert.push(location_product);
      }
    }
  }

  console.log(`Processed ${location_products_insert.length} location products`);
  return location_products_insert;
}

async function mock_user_profile(by_id: string) {
  const list_all_user = await prisma_platform.tb_user_profile.findMany();
  const user_profiles_insert = [];

  for (const user of list_all_user) {
    const find_user_profile = await prisma_client.tb_user_profile.findFirst({
      where: {
        user_id: user.id,
      },
    });

    if (find_user_profile) {
      const update_user_profile = await prisma_client.tb_user_profile.update({
        where: {
          user_id: user.id,
        },
        data: {
          user_id: user.id,
          firstname: user.firstname,
          middlename: user.middlename,
          lastname: user.lastname,
          bio: user.bio,
        },
      });

      console.log(`Updated user profile: ${user.id}`);
      user_profiles_insert.push(update_user_profile);
    } else {
      const insert_user_profile = await prisma_client.tb_user_profile.create({
        data: {
          user_id: user.id,
          firstname: user.firstname,
          middlename: user.middlename,
          lastname: user.lastname,
          bio: user.bio,
        },
      });

      console.log(`Inserted user profile: ${user.id}`);
      user_profiles_insert.push(insert_user_profile);
    }
  }

  console.log(`Processed ${user_profiles_insert.length} user profiles`);
  return user_profiles_insert;
}

async function main() {
  // Add your seed data here
  console.log("Mocking database...");

  const user = await get_user_by_username("test@test.com");

  await mock_user_profile(user.id);

  await mock_unit(user.id);
  await mock_product_category(user.id);
  await mock_product(user.id);
  await mock_delivery_point(user.id);
  await mock_location(user.id);
  await mock_department(user.id);

  await mock_department_user(user.id);
  await mock_user_location(user.id);
  await mock_product_location(user.id);

  await mock_vendor(user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma_client.$disconnect();
    await prisma_platform.$disconnect();
  });
