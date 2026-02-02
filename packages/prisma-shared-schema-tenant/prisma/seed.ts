import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import { enum_business_unit_config_key } from "@repo/prisma-shared-schema-tenant";

const prisma_tenant = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const prisma_platform = PrismaClient_SYSTEM;

async function get_business_unit_by_code(code: string) {
  const business_unit = await prisma_platform.tb_business_unit.findFirst({
    where: {
      code: code,
    },
  });

  if (!business_unit) {
    console.error(`Business unit ${code} not found`);
    process.exit(1);
  }

  return business_unit;
}

async function upsert_business_unit_config(
  business_unit_code: string,
  calculation_method: string,
  currency_base: { id: string; code: string; name: string; symbol: string },
  created_by_id: string
) {
  // get business unit
  const business_unit = await get_business_unit_by_code(business_unit_code);

  // system config
  const system_config = [
    {
      id: "9a213fdc-25df-4d05-8876-a2f52f03f715",
      key: "calculation_method",
      label: "calculation_method",
      value: "zzz",
      datatype: "string",
    },
    {
      id: "1c22fa4e-ee68-46de-82f3-0d020c19cb7e",
      key: "currency_base",
      label: "Currency Base",
      value: {
        name: "Thai Baht",
        locales: "th-TH",
        currency_id: "4a6af751-7f13-46cf-8b70-992f316fd9d3",
        minimumIntegerDigits: 2,
      },
    },
    {
      id: "203bcd1d-16ac-4eda-86ae-e887ed3c9c74",
      key: "date_format",
      label: "Date Format",
      value: "dd/mm/yyyy",
    },
    {
      id: "bf379e5b-e03d-4165-9f2a-4a1b1d7de538",
      key: "long_time_format",
      label: "Long Time Format",
      value: "HH:mm:ss",
    },
    {
      id: "727433dc-c502-4b8f-801e-b66b4a022434",
      key: "short_time_format",
      label: "Short Time Format",
      value: "HH:mm",
    },
    {
      id: "4448c066-9e7d-493e-a0aa-e44357d19af2",
      key: "timezone",
      label: "Timezone",
      value: "Asia/Bangkok",
    },
    {
      id: "42fdc858-9c74-4b30-a6d6-97e531a4d392",
      key: "perpage",
      label: "Per Page",
      value: "20",
    },
    {
      id: "cc6756f1-5ebf-4919-9322-45e23a5dcff1",
      key: "hotel",
      label: "hotel",
      value: {
        name: "The Yama Phuket Hotel",
        email: "fc@theyamaphuket.com",
        address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
        country: "THAILAND",
        zip_code: "83100",
        telephone: "076-303-456",
      },
      datatype: "object",
    },
    {
      id: "388e13f2-951d-4384-9847-9885079b9eab",
      key: "company",
      label: "company",
      value: {
        name: "Puranakarn Co., Ltd   (Head Office)",
        email: "fc@theyamaphuket.com",
        address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
        country: "THAILAND",
        zip_code: "83100",
        telephone: "076-303-456",
      },
      datatype: "object",
    },
    {
      id: "c9afa1fc-dae9-4d43-b315-091c439f1c48",
      key: "amount",
      label: "amount",
      value: { locales: "th-TH", minimumIntegerDigits: 2 },
      datatype: "object",
    },
    {
      id: "cd3d0dc8-b243-4d06-ab46-1e9ba810d509",
      key: "quantity",
      label: "quantity",
      value: { locales: "th-TH", minimumIntegerDigits: 2 },
      datatype: "object",
    },
    {
      id: "3441dda7-9698-4d08-8c1f-06aa00873b11",
      key: "recipe",
      label: "recipe",
      value: { locales: "th-TH", minimumIntegerDigits: 3 },
      datatype: "object",
    },
    {
      id: "9133de5e-44fc-4300-b168-cf66cd08f22c",
      key: "branch_no",
      label: "BRANCH NO",
      value: "00000",
      datatype: "string",
    },
    {
      id: "efea4bb9-0cd2-4cfa-951f-c5b3e10e0420",
      key: "tax_id",
      label: "TAX ID",
      value: "0835553001610",
      datatype: "string",
    },
  ];

  // ตรวจสอบและกำหนดค่าเริ่มต้นสำหรับ business_unit_config
  let business_unit_config: any[] = business_unit.config as any[] || [];

  let new_business_unit_config_calculation_method = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.calculation_method
  );
  let new_business_unit_config_currency_base = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.currency_base
  );
  let new_business_unit_config_date_format = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.date_format
  );
  let new_business_unit_config_long_time_format = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.long_time_format
  );
  let new_business_unit_config_short_time_format = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.short_time_format
  );
  let new_business_unit_config_timezone = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.timezone
  );
  let new_business_unit_config_perpage = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.perpage
  );
  let new_business_unit_config_hotel = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.hotel
  );
  let new_business_unit_config_company = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.company
  );
  let new_business_unit_config_tax_id = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.tax_id
  );
  let new_business_unit_config_branch_no = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.branch_no
  );
  let new_business_unit_config_amount = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.amount
  );
  let new_business_unit_config_quantity = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.quantity
  );
  let new_business_unit_config_recipe = business_unit_config.findIndex(
    (config) => config.key === enum_business_unit_config_key.recipe
  );

  if (new_business_unit_config_calculation_method !== -1) {
    business_unit_config[new_business_unit_config_calculation_method].value = calculation_method;
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Calculation Method",
      key: enum_business_unit_config_key.calculation_method,
      value: calculation_method,
    });
  }

  if (new_business_unit_config_currency_base !== -1) {
    business_unit_config[new_business_unit_config_currency_base].value = currency_base.code;
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Currency Base",
      key: enum_business_unit_config_key.currency_base,
      value: {
        name: currency_base.name,
        locales: "th-TH",
        currency_id: currency_base.id,
        minimumIntegerDigits: 2,
      },
    });
  }

  if (new_business_unit_config_date_format !== -1) {
    business_unit_config[new_business_unit_config_date_format].value = "dd/mm/yyyy";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Date Format",
      key: enum_business_unit_config_key.date_format,
      value: "dd/mm/yyyy",
    });
  }

  if (new_business_unit_config_long_time_format !== -1) {
    business_unit_config[new_business_unit_config_long_time_format].value = "HH:mm:ss";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Long Time Format",
      key: enum_business_unit_config_key.long_time_format,
      value: "HH:mm:ss",
    });
  }

  if (new_business_unit_config_short_time_format !== -1) {
    business_unit_config[new_business_unit_config_short_time_format].value = "HH:mm";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Short Time Format",
      key: enum_business_unit_config_key.short_time_format,
      value: "HH:mm",
    });
  }

  if (new_business_unit_config_timezone !== -1) {
    business_unit_config[new_business_unit_config_timezone].value = "Asia/Bangkok";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Timezone",
      key: enum_business_unit_config_key.timezone,
      value: "Asia/Bangkok",
    });
  }

  if (new_business_unit_config_perpage !== -1) {
    business_unit_config[new_business_unit_config_perpage].value = "20";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Per Page",
      key: enum_business_unit_config_key.perpage,
      value: "20",
    });
  }

  if (new_business_unit_config_hotel !== -1) {
    business_unit_config[new_business_unit_config_hotel].value = {
      name: "The Yama Phuket Hotel",
      email: "fc@theyamaphuket.com",
      address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
      country: "THAILAND",
      zip_code: "83100",
      telephone: "076-303-456",
    };
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Hotel",
      key: enum_business_unit_config_key.hotel,
      value: {
        name: "The Yama Phuket Hotel",
        email: "fc@theyamaphuket.com",
        address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
        country: "THAILAND",
        zip_code: "83100",
        telephone: "076-303-456",
      },
    });
  }

  if (new_business_unit_config_company !== -1) {
    business_unit_config[new_business_unit_config_company].value = {
      name: "Puranakarn Co., Ltd   (Head Office)",
      email: "fc@theyamaphuket.com",
      address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
      country: "THAILAND",
      zip_code: "83100",
      telephone: "076-303-456",
    };
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Company",
      key: enum_business_unit_config_key.company,
      value: {
        name: "Puranakarn Co., Ltd   (Head Office)",
        email: "fc@theyamaphuket.com",
        address: "5 Patak Soi 2,  Karon, Muang Phuket, Phuket, 83100",
        country: "THAILAND",
        zip_code: "83100",
      },
    });
  }

  if (new_business_unit_config_tax_id !== -1) {
    business_unit_config[new_business_unit_config_tax_id].value = "0835553001610";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Tax ID",
      key: enum_business_unit_config_key.tax_id,
      value: "0835553001610",
    });
  }

  if (new_business_unit_config_branch_no !== -1) {
    business_unit_config[new_business_unit_config_branch_no].value = "00000";
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Branch No",
      key: enum_business_unit_config_key.branch_no,
      value: "00000",
    });
  }

  if (new_business_unit_config_amount !== -1) {
    business_unit_config[new_business_unit_config_amount].value = { locales: "th-TH", minimumIntegerDigits: 2 };
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Amount",
      key: enum_business_unit_config_key.amount,
      value: { locales: "th-TH", minimumIntegerDigits: 2 },
    });
  }

  if (new_business_unit_config_quantity !== -1) {
    business_unit_config[new_business_unit_config_quantity].value = { locales: "th-TH", minimumIntegerDigits: 2 };
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Quantity",
      key: enum_business_unit_config_key.quantity,
      value: { locales: "th-TH", minimumIntegerDigits: 2 },
    });
  }

  if (new_business_unit_config_recipe !== -1) {
    business_unit_config[new_business_unit_config_recipe].value = { locales: "th-TH", minimumIntegerDigits: 3 };
  } else {
    business_unit_config.push({
      id: uuidv4(),
      label: "Recipe",
      key: enum_business_unit_config_key.recipe,
      value: { locales: "th-TH", minimumIntegerDigits: 3 },
    });
  }

  console.log("Business unit config:", business_unit_config);

  // update business unit
  await prisma_platform.tb_business_unit.update({
    where: {
      id: business_unit.id,
    },
    data: {
      config: business_unit_config,
    },
  });

  console.log(`Business unit ${business_unit_code} config updated`);
}

async function upsert_currency(code: string, by_id: string) {
  // get currency_iso
  const currency_iso = await prisma_platform.tb_currency_iso.findFirst({
    where: {
      iso_code: code,
    },
  });

  if (!currency_iso) {
    console.error(`Currency ISO ${code} not found`);
    process.exit(1);
  }

  const currency = await prisma_tenant.tb_currency.findFirst({
    where: {
      code: code,
    },
  });

  if (!currency) {
    const new_currency = await prisma_tenant.tb_currency.create({
      data: {
        code: currency_iso.iso_code || "",
        name: currency_iso.name,
        symbol: currency_iso.symbol,
        exchange_rate: 1,
        exchange_rate_at: new Date(),
        created_by_id: by_id,
      },
    });

    return new_currency;
  }

  return currency;
}

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

async function upsert_tax_profile(business_unit_code: string) {
  // get business unit
  // const business_unit = await get_business_unit_by_code(business_unit_code);

  // upsert tax profile
  const tax_profile = await prisma_tenant.tb_application_config.findFirst({
    where: {
      key: "tax_profile",
    },
  });

  if (!tax_profile) {

    const tax_profiles = [
      {
        id: uuidv4(),
        name: "VAT 7%",
        tax_rate: 7,
        is_active: true,
      },
      {
        id: uuidv4(),
        name: "VAT 10%",
        tax_rate: 10,
        is_active: true,
      },
      {
        id: uuidv4(),
        name: "None",
        tax_rate: 0,
        is_active: true,
      },
    ]
    const new_tax_profile = await prisma_tenant.tb_application_config.create({
      data: {
        key: "tax_profile",
        value: tax_profiles,
      },
    });

    console.log(`Tax profile ${new_tax_profile.id} created`);

    return new_tax_profile;
  }else{
    const tax_profiles = tax_profile.value as any[];

    console.log(`Tax profile ${tax_profile.id} updated`);

    return tax_profile;
  }

}

async function main() {
  // Add your seed data here
  console.log("Seeding database...");

  // get user_test
  const user_test = await get_user_by_username("test@test.com");

  // upsert currency base
  const currency_base = await upsert_currency("THB", user_test.id);

  // upsert application base config
  const application_base_config_carmen_1 = await upsert_business_unit_config(
    "C1",
    "FIFO",
    {
      id: currency_base.id,
      code: currency_base.code,
      name: currency_base.name,
      symbol: currency_base.symbol || "฿",
    },
    user_test.id
  );

  const application_base_config_carmen_2 = await upsert_business_unit_config(
    "C2",
    "AVG",
    {
      id: currency_base.id,
      code: currency_base.code,
      name: currency_base.name,
      symbol: currency_base.symbol || "฿",
    },
    user_test.id
  );

  const application_base_config_carmen_3 = await upsert_business_unit_config(
    "C3",
    "FIFO",
    {
      id: currency_base.id,
      code: currency_base.code,
      name: currency_base.name,
      symbol: currency_base.symbol || "฿",
    },
    user_test.id
  );

  // add tax-profile
  const tax_profile_carmen_1 = await upsert_tax_profile(
    "C1"
  );

}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma_tenant.$disconnect();
    await prisma_platform.$disconnect();
  });

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
