import { ConsoleLogger } from '@nestjs/common';
import {
  enum_cluster_user_role,
  enum_user_business_unit_role,
  PrismaClient,
} from "@repo/prisma-shared-schema-platform";
import { enum_platform_role } from "@repo/prisma-shared-schema-platform";

const prisma_platform = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SYSTEM_DIRECT_URL,
    },
  },
});

// get user from supabase
// async function get_user_from_supabase(
//   email: string,
//   firstname: string,
//   lastname: string
// ) {
//   const supabase = SupabaseClient;
//   await supabase.auth.signOut();
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email: email,
//     password: "123456",
//   });

//   if (error) {
//     // create user in supabase

//     console.error("Error getting user from supabase:", error);

//     const { data: user_data, error: user_error } = await supabase.auth.signUp({
//       email: email,
//       password: "123456",
//     });

//     if (user_error) {
//       console.error("Error creating user in supabase:", user_error);
//     }

//     console.log("User created in supabase:", user_data);
//     return user_data;
//   }

//   console.log("User from supabase:", data);

//   return data;
// }

// async function upsert_user(
//   email: string,
//   firstname: string,
//   lastname: string,
//   platform_role: enum_platform_role,
//   created_by_id: string | null
// ) {
//   const user_data: any = await get_user_from_supabase(
//     email,
//     firstname,
//     lastname
//   );

//   let user = await prisma_platform.tb_user.findFirst({
//     where: {
//       email: email,
//     },
//   });

//   if (!user) {
//     user = await prisma_platform.tb_user.create({
//       data: {
//         id: user_data.user.id,
//         email: email,
//         username: email,
//         platform_role: platform_role as enum_platform_role,
//         is_active: true,
//         is_consent: true,
//         consent_at: new Date(),
//         created_by_id: created_by_id,
//       },
//     });
//   } else {
//     user = await prisma_platform.tb_user.update({
//       where: {
//         id: user.id,
//       },
//       data: {
//         platform_role: platform_role as enum_platform_role,
//         is_active: true,
//         is_consent: true,
//         consent_at: new Date(),
//         updated_by_id: created_by_id,
//         updated_at: new Date(),
//       },
//     });
//   }

//   // update user_profile

//   let user_profile = await prisma_platform.tb_user_profile.findFirst({
//     where: {
//       user_id: user.id,
//     },
//   });

//   if (!user_profile) {
//     user_profile = await prisma_platform.tb_user_profile.create({
//       data: {
//         user_id: user.id,
//         firstname: firstname,
//         lastname: lastname,
//       },
//     });
//   } else {
//     user_profile = await prisma_platform.tb_user_profile.update({
//       where: {
//         id: user_profile.id,
//       },
//       data: {
//         firstname: firstname,
//         lastname: lastname,
//       },
//     });
//   }

//   console.log("Upserted user:", user);
//   console.log("Upserted user profile:", user_profile);

//   return { user, user_profile };
// }

async function upsert_cluster(
  name: string,
  code: string,
  created_by_id: string
) {
  const cluster = await prisma_platform.tb_cluster.upsert({
    where: {
      code_name_deleted_at: {
        name: name,
        code: code,
        deleted_at: null,
      },
    },
    update: {
      name: name,
      code: code,
      created_by_id: created_by_id,
    },
    create: {
      name: name,
      code: code,
      created_by_id: created_by_id,
    },
  });

  console.log("Upserted cluster:", cluster);

  return cluster;
}

async function upsert_business_unit(
  name: string,
  code: string,
  is_hq: boolean,
  cluster_id: string,
  created_by_id: string
) {
  const db_connection = {
    host: "dev.blueledgers.com",
    port: 6432,
    schema: "CARMEN_TENANT_1",
    database: "postgres",
    password: "123456",
    provider: "postgresql",
    username: "developer",
  };
  const business_unit = await prisma_platform.tb_business_unit.upsert({
    where: {
      cluster_id_code_deleted_at: {
        cluster_id: cluster_id,
        code: code,
        deleted_at: null,
      },
    },
    update: {
      name: name,
      code: code,
      db_connection: db_connection,
      cluster_id: cluster_id,
      is_hq: is_hq,
      created_by_id: created_by_id,
    },
    create: {
      name: name,
      code: code,
      db_connection: db_connection,
      cluster_id: cluster_id,
      is_hq: is_hq,
      created_by_id: created_by_id,
    },
  });

  console.log("Upserted business unit:", business_unit);

  return business_unit;
}

async function upsert_cluster_user(
  cluster_id: string,
  user_id: string,
  role: enum_cluster_user_role,
  created_by_id: string
) {
  const cluster_user = await prisma_platform.tb_cluster_user.upsert({
    where: {
      user_id_cluster_id_deleted_at: {
        user_id: user_id,
        cluster_id: cluster_id,
        deleted_at: null,
      },
    },
    update: {
      role: role as enum_cluster_user_role,
      updated_by_id: created_by_id,
      updated_at: new Date(),
    },
    create: {
      cluster_id: cluster_id,
      user_id: user_id,
      role: role as enum_cluster_user_role,
      created_by_id: created_by_id,
      created_at: new Date(),
    },
  });

  console.log("Upserted cluster user:", cluster_user);

  return cluster_user;
}

async function upsert_business_unit_user(
  business_unit_id: string,
  user_id: string,
  role: enum_user_business_unit_role,
  created_by_id: string
) {
  const business_unit_user = await prisma_platform.tb_user_tb_business_unit.upsert({
    where: {
      user_id_business_unit_id_deleted_at: {
        user_id: user_id,
        business_unit_id: business_unit_id,
        deleted_at: null,
      },
    },
    update: {
      role: role as enum_user_business_unit_role,
      created_by_id: created_by_id,
      updated_at: new Date(),
    },
    create: {
      business_unit_id: business_unit_id,
      user_id: user_id,
      role: role as enum_user_business_unit_role,
      created_at: new Date(),
    },
  });

  console.log("Upserted business unit user:", business_unit_user);

  return business_unit_user;
}

const MOCK_USERS = [
  {
    email: "system-admin@blueledgers.com",
    firstname: "system-admin",
    lastname: "system-admin",
    telephone: "0000000000",
    platform_role: enum_platform_role.platform_admin,
    created_by_id: null
  },
  {
    email: "test@test.com",
    firstname: "test",
    lastname: "test",
    telephone: "1111111111",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin" // will be replaced with actual ID
  },
  {
    email: "admin@blueledgers.com",
    firstname: "admin",
    lastname: "admin",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  },
  {
    email: "user1@blueledgers.com",
    firstname: "user1",
    lastname: "staff",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  },
  {
    email: "user2@blueledgers.com",
    firstname: "user2",
    lastname: "department-manager",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  },
  {
    email: "user3@blueledgers.com",
    firstname: "user3",
    lastname: "purchasing-staff",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  },
  {
    email: "user4@blueledgers.com",
    firstname: "user4",
    lastname: "finance-manager",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  },
  {
    email: "user5@blueledgers.com",
    firstname: "user5",
    lastname: "general-manager",
    telephone: "1234567890",
    platform_role: enum_platform_role.user,
    created_by_id: "system_admin"
  }
] as const;

async function main() {
  // Add your seed data here
  console.log("Seeding database...");

  // const { user: user_system_admin, user_profile: user_profile_system_admin } =
  //   await upsert_user(
  //     MOCK_USERS[0].email,
  //     MOCK_USERS[0].firstname,
  //     MOCK_USERS[0].lastname,
  //     MOCK_USERS[0].platform_role,
  //     MOCK_USERS[0].created_by_id
  //   );
  // const { user: user_test, user_profile: user_profile_test } =
  //   await upsert_user(
  //     MOCK_USERS[1].email,
  //     MOCK_USERS[1].firstname,
  //     MOCK_USERS[1].lastname,
  //     MOCK_USERS[1].platform_role,
  //     user_system_admin.id
  //   );
  // const { user: user_admin, user_profile: user_profile_admin } =
  //   await upsert_user(
  //     MOCK_USERS[2].email,
  //     MOCK_USERS[2].firstname,
  //     MOCK_USERS[2].lastname,
  //     MOCK_USERS[2].platform_role,
  //     user_system_admin.id
  //   );
  // const { user: user1_staff, user_profile: user_profile_user1_staff } =
  //   await upsert_user(
  //     MOCK_USERS[3].email,
  //     MOCK_USERS[3].firstname,
  //     MOCK_USERS[3].lastname,
  //     MOCK_USERS[3].platform_role,
  //     user_system_admin.id
  //   );
  // const {
  //   user: user2_department_manager,
  //   user_profile: user_profile_user2_department_manager,
  // } = await upsert_user(
  //   MOCK_USERS[4].email,
  //   MOCK_USERS[4].firstname,
  //   MOCK_USERS[4].lastname,
  //   MOCK_USERS[4].platform_role,
  //   user_system_admin.id
  // );
  // const {
  //   user: user3_purchasing_staff,
  //   user_profile: user_profile_user3_purchasing_staff,
  // } = await upsert_user(
  //   MOCK_USERS[5].email,
  //   MOCK_USERS[5].firstname,
  //   MOCK_USERS[5].lastname,
  //   MOCK_USERS[5].platform_role,
  //   user_system_admin.id
  // );
  // const {
  //   user: user4_finance_manager,
  //   user_profile: user_profile_user4_finance_manager,
  // } = await upsert_user(
  //   MOCK_USERS[6].email,
  //   MOCK_USERS[6].firstname,
  //   MOCK_USERS[6].lastname,
  //   MOCK_USERS[6].platform_role,
  //   user_system_admin.id
  // );
  // const {
  //   user: user5_general_manager,
  //   user_profile: user_profile_user5_general_manager,
  // } = await upsert_user(
  //   MOCK_USERS[7].email,
  //   MOCK_USERS[7].firstname,
  //   MOCK_USERS[7].lastname,
  //   MOCK_USERS[7].platform_role,
  //   user_system_admin.id
  // );

  // // Example: Create a cluster
  // const cluster_carmen = await upsert_cluster(
  //   "Carmen Cluster",
  //   "CARMEN",
  //   user_system_admin.id
  // );

  // // create cluster user
  // const cluster_user_system_admin = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user_system_admin.id,
  //   enum_cluster_user_role.admin,
  //   user_system_admin.id
  // );
  // const cluster_user_test = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user_test.id,
  //   enum_cluster_user_role.user,
  //   user_test.id
  // );
  // const cluster_user_admin = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user_admin.id,
  //   enum_cluster_user_role.admin,
  //   user_admin.id
  // );
  // const cluster_user_user1_staff = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user1_staff.id,
  //   enum_cluster_user_role.user,
  //   user_admin.id
  // );
  // const cluster_user_user2_department_manager = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user2_department_manager.id,
  //   enum_cluster_user_role.user,
  //   user_admin.id
  // );
  // const cluster_user_user3_purchasing_staff = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user3_purchasing_staff.id,
  //   enum_cluster_user_role.user,
  //   user_admin.id
  // );
  // const cluster_user_user4_finance_manager = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user4_finance_manager.id,
  //   enum_cluster_user_role.user,
  //   user_admin.id
  // );
  // const cluster_user_user5_general_manager = await upsert_cluster_user(
  //   cluster_carmen.id,
  //   user5_general_manager.id,
  //   enum_cluster_user_role.user,
  //   user_admin.id
  // );

  // // create business unit
  // const business_unit_carmen_1 = await upsert_business_unit(
  //   "BU-CARMEN-1",
  //   "CARMEN-1",
  //   true,
  //   cluster_carmen.id,
  //   user_admin.id
  // );
  // const business_unit_carmen_2 = await upsert_business_unit(
  //   "BU-CARMEN-2",
  //   "CARMEN-2",
  //   false,
  //   cluster_carmen.id,
  //   user_admin.id
  // );
  // const business_unit_carmen_3 = await upsert_business_unit(
  //   "BU-CARMEN-3",
  //   "CARMEN-3",
  //   false,
  //   cluster_carmen.id,
  //   user_admin.id
  // );

  // // add all user to business_unit_carmen_1
  // const business_unit_carmen_1_user_system_admin =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user_system_admin.id,
  //     enum_user_business_unit_role.admin,
  //     user_system_admin.id
  //   );
  // const business_unit_carmen_1_user_admin = await upsert_business_unit_user(
  //   business_unit_carmen_1.id,
  //   user_admin.id,
  //   enum_user_business_unit_role.admin,
  //   user_admin.id
  // );
  // const business_unit_carmen_1_user_user1_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user1_staff.id,
  //     enum_user_business_unit_role.user,
  //     user1_staff.id
  //   );
  // const business_unit_carmen_1_user_user2_department_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user2_department_manager.id,
  //     enum_user_business_unit_role.user,
  //     user2_department_manager.id
  //   );
  // const business_unit_carmen_1_user_user3_purchasing_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user3_purchasing_staff.id,
  //     enum_user_business_unit_role.user,
  //     user3_purchasing_staff.id
  //   );
  // const business_unit_carmen_1_user_user4_finance_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user4_finance_manager.id,
  //     enum_user_business_unit_role.user,
  //     user4_finance_manager.id
  //   );
  // const business_unit_carmen_1_user_user5_general_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_1.id,
  //     user5_general_manager.id,
  //     enum_user_business_unit_role.user,
  //     user5_general_manager.id
  //   );

  // // add all user to business_unit_carmen_2
  // const business_unit_carmen_2_user_system_admin =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user_system_admin.id,
  //     enum_user_business_unit_role.admin,
  //     user_system_admin.id
  //   );
  // const business_unit_carmen_2_user_admin = await upsert_business_unit_user(
  //   business_unit_carmen_2.id,
  //   user_admin.id,
  //   enum_user_business_unit_role.admin,
  //   user_admin.id
  // );
  // const business_unit_carmen_2_user_user1_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user1_staff.id,
  //     enum_user_business_unit_role.user,
  //     user1_staff.id
  //   );
  // const business_unit_carmen_2_user_user2_department_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user2_department_manager.id,
  //     enum_user_business_unit_role.user,
  //     user2_department_manager.id
  //   );
  // const business_unit_carmen_2_user_user3_purchasing_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user3_purchasing_staff.id,
  //     enum_user_business_unit_role.user,
  //     user3_purchasing_staff.id
  //   );
  // const business_unit_carmen_2_user_user4_finance_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user4_finance_manager.id,
  //     enum_user_business_unit_role.user,
  //     user4_finance_manager.id
  //   );
  // const business_unit_carmen_2_user_user5_general_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_2.id,
  //     user5_general_manager.id,
  //     enum_user_business_unit_role.user,
  //     user5_general_manager.id
  //   );

  // // add all user to business_unit_carmen_3
  // const business_unit_carmen_3_user_system_admin =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user_system_admin.id,
  //     enum_user_business_unit_role.admin,
  //     user_system_admin.id
  //   );
  // const business_unit_carmen_3_user_admin = await upsert_business_unit_user(
  //   business_unit_carmen_3.id,
  //   user_admin.id,
  //   enum_user_business_unit_role.admin,
  //   user_admin.id
  // );
  // const business_unit_carmen_3_user_user1_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user1_staff.id,
  //     enum_user_business_unit_role.user,
  //     user1_staff.id
  //   );
  // const business_unit_carmen_3_user_user2_department_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user2_department_manager.id,
  //     enum_user_business_unit_role.user,
  //     user2_department_manager.id
  //   );
  // const business_unit_carmen_3_user_user3_purchasing_staff =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user3_purchasing_staff.id,
  //     enum_user_business_unit_role.user,
  //     user3_purchasing_staff.id
  //   );
  // const business_unit_carmen_3_user_user4_finance_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user4_finance_manager.id,
  //     enum_user_business_unit_role.user,
  //     user4_finance_manager.id
  //   );
  // const business_unit_carmen_3_user_user5_general_manager =
  //   await upsert_business_unit_user(
  //     business_unit_carmen_3.id,
  //     user5_general_manager.id,
  //     enum_user_business_unit_role.user,
  //     user5_general_manager.id
  //   );

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma_platform.$disconnect();
  });
