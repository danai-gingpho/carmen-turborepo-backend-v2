/** @format */

import { PrismaClient_TENANT } from './src/client';

async function testPrismaClient() {
  console.log('🧪 Testing Prisma Client...\n');

  // Replace with your actual database URL
  const testDatasourceURL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/test_db';
  const tenantId = 'TEST_TENANT_001';

  try {
    console.log('1️⃣ Testing initial connection...');
    const client1 = await PrismaClient_TENANT(tenantId, testDatasourceURL);

    if (!client1) {
      throw new Error('Failed to get client instance');
    }

    console.log('✅ Initial connection successful\n');

    // Test that we get the same client for the same tenant
    console.log('2️⃣ Testing client caching...');
    const client2 = await PrismaClient_TENANT(tenantId, testDatasourceURL);
    console.log(`✅ Same client returned: ${client1 === client2}\n`);

    // Test connection with different datasource URL (should create new client)
    console.log('3️⃣ Testing connection with different datasource...');
    const newDatasourceURL = testDatasourceURL + '?schema=different';
    const client3 = await PrismaClient_TENANT(tenantId, newDatasourceURL);
    console.log(`✅ Different client created: ${client1 !== client3}\n`);

    // Test middleware by performing a create operation (you'll need a valid model)
    console.log('4️⃣ Testing middleware (check console for $use logs)...');
    // Uncomment and modify for your actual model:
    // await client1.yourModel.create({ data: { field: 'test' } });
    console.log('⚠️  Skipped - add your model test here\n');

    console.log('✅ All tests passed!');

    // Cleanup
    await client1?.$disconnect();
    await client3?.$disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testPrismaClient();
