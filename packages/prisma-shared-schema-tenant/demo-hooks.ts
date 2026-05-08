/** @format */

import { PrismaClient_TENANT } from './src/client';

async function demonstrateHooks() {
  console.log('🎯 Demonstrating Before Create and Before Update Hooks\n');

  const datasourceURL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/test_db';
  const tenantId = 'DEMO_TENANT';

  try {
    console.log('1️⃣ Getting Prisma Client with hooks...');
    const client = await PrismaClient_TENANT(tenantId, datasourceURL);

    if (!client) {
      throw new Error('Failed to get client');
    }

    console.log('✅ Client connected with hooks enabled\n');

    console.log('📝 The hooks will automatically:');
    console.log('   - Trim all string values in create/update data');
    console.log('   - Log before and after each operation');
    console.log('   - Work with: create, update, createMany, updateMany, upsert\n');

    console.log('Example: When you call client.yourModel.create({ data: { name: "  test  " } })');
    console.log('The hook will trim it to: { name: "test" }\n');

    console.log('🔍 Supported operations:');
    console.log('   ✓ create()      - beforeCreate hook');
    console.log('   ✓ createMany()  - beforeCreate hook');
    console.log('   ✓ update()      - beforeUpdate hook');
    console.log('   ✓ updateMany()  - beforeUpdate hook');
    console.log('   ✓ upsert()      - both hooks');

    console.log('\n💡 To test with actual data, uncomment the examples below:\n');
    console.log('// Example Create:');
    console.log('// await client.yourModel.create({');
    console.log('//   data: { name: "  Test Name  ", email: "  test@example.com  " }');
    console.log('// });');
    console.log('// Result: name="Test Name", email="test@example.com" (trimmed)\n');

    console.log('// Example Update:');
    console.log('// await client.yourModel.update({');
    console.log('//   where: { id: 1 },');
    console.log('//   data: { name: "  Updated Name  " }');
    console.log('// });');
    console.log('// Result: name="Updated Name" (trimmed)\n');

    await client.$disconnect();
    console.log('✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

demonstrateHooks();
