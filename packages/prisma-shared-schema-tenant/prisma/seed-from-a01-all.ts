import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const SEED_DATA_DIR = path.join(__dirname, "seed-data-a01");

// Global error tracking
interface ErrorDetail {
  tableName: string;
  recordId: string;
  operation: string;
  errorType: string;
  errorCode: string;
  message: string;
  recordData?: any;
  meta?: any;
}

const globalErrors: ErrorDetail[] = [];
const tableSummary: Map<string, { total: number; success: number; errors: number; }> = new Map();

// Helper to read JSON data
function readTableData(tableName: string): any[] {
  const filePath = path.join(SEED_DATA_DIR, `${tableName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return [];
}

// Table-specific unique field mappings
const TABLE_UNIQUE_FIELDS: Record<string, string[]> = {
  tb_currency: ['code'],
  tb_unit: ['code'],
  tb_credit_term: ['name'],
  tb_extra_cost_type: ['name'],
  tb_vendor_business_type: ['name'],
  tb_department: ['code', 'name'],
  tb_delivery_point: ['code'],
  tb_location: ['code'],
  tb_product_category: ['code'],
  tb_product_sub_category: ['code'],
  tb_product_item_group: ['code'],
  tb_vendor: ['code'],
  tb_product: ['code'],
  tb_workflow: ['code'],
  tb_config_running_code: ['type'],
  tb_application_config: ['key'],
};

// Tables with non-standard primary keys
const TABLE_PRIMARY_KEYS: Record<string, string> = {
  tb_user_profile: 'user_id',
};

// Helper function to generate code from name or use a counter
function generateCodeFromName(name: string, maxLength: number = 50): string {
  if (!name) return '';
  // Remove special characters, convert to uppercase, replace spaces with underscores
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, maxLength);
}

// Helper function to ensure required fields are present
function ensureRequiredFields(record: any, tableName: string, index: number): any {
  const enrichedRecord = { ...record };

  // Handle code field generation for tables that require it
  const tablesRequiringCode = [
    'tb_department',
    'tb_vendor',
    'tb_product',
    'tb_product_category',
    'tb_product_sub_category',
    'tb_product_item_group',
    'tb_location',
  ];

  if (tablesRequiringCode.includes(tableName)) {
    if (!enrichedRecord.code || enrichedRecord.code === '') {
      // Generate code from name if available, otherwise use index
      if (enrichedRecord.name) {
        enrichedRecord.code = generateCodeFromName(enrichedRecord.name);
      } else if (enrichedRecord.id) {
        // Use last 8 characters of ID as code
        enrichedRecord.code = enrichedRecord.id.toString().slice(-8).toUpperCase();
      } else {
        // Fallback: use table name prefix + index
        const prefix = tableName.replace('tb_', '').toUpperCase().substring(0, 3);
        enrichedRecord.code = `${prefix}_${String(index).padStart(5, '0')}`;
      }
    }
  }

  // Remove foreign key fields that might not exist yet to avoid constraint violations
  // We'll handle this by removing optional foreign key references that point to non-existent records

  return enrichedRecord;
}

// Cache for foreign key existence checks to improve performance
const fkExistenceCache = new Map<string, Map<string, boolean>>();

// Helper to check if a foreign key reference exists (with caching)
async function checkForeignKeyExists(prismaModel: any, tableName: string, id: string): Promise<boolean> {
  if (!id) return true; // null/undefined is okay for optional fields

  // Check cache first
  if (!fkExistenceCache.has(tableName)) {
    fkExistenceCache.set(tableName, new Map());
  }
  const tableCache = fkExistenceCache.get(tableName)!;

  if (tableCache.has(id)) {
    return tableCache.get(id)!;
  }

  // Query database
  try {
    const record = await prismaModel.findFirst({ where: { id } });
    const exists = record !== null;
    tableCache.set(id, exists);
    return exists;
  } catch {
    tableCache.set(id, false);
    return false;
  }
}

// Helper to validate and clean foreign key references
async function validateForeignKeys(record: any, tableName: string): Promise<any> {
  const cleanedRecord = { ...record };

  // Define foreign key validations for specific tables
  const fkValidations: Record<string, Array<{ field: string, model: any, nullable: boolean }>> = {
    tb_product_category: [],
    tb_product_sub_category: [
      { field: 'product_category_id', model: prisma.tb_product_category, nullable: false }
    ],
    tb_product_item_group: [
      { field: 'product_subcategory_id', model: prisma.tb_product_sub_category, nullable: false }
    ],
    tb_product: [
      { field: 'product_category_id', model: prisma.tb_product_category, nullable: true },
      { field: 'product_subcategory_id', model: prisma.tb_product_sub_category, nullable: true },
      { field: 'product_item_group_id', model: prisma.tb_product_item_group, nullable: true }
    ],
    tb_vendor: [],
    tb_vendor_address: [
      { field: 'vendor_id', model: prisma.tb_vendor, nullable: false }
    ],
    tb_vendor_contact: [
      { field: 'vendor_id', model: prisma.tb_vendor, nullable: false }
    ],
    tb_unit_conversion: [
      { field: 'product_id', model: prisma.tb_product, nullable: true }
    ],
    tb_product_location: [
      { field: 'product_id', model: prisma.tb_product, nullable: false },
      { field: 'location_id', model: prisma.tb_location, nullable: false }
    ],
    tb_purchase_request_detail: [
      { field: 'purchase_request_id', model: prisma.tb_purchase_request, nullable: false },
      { field: 'product_id', model: prisma.tb_product, nullable: false },
      { field: 'location_id', model: prisma.tb_location, nullable: true },
      { field: 'currency_id', model: prisma.tb_currency, nullable: true }
    ]
  };

  const validations = fkValidations[tableName];
  if (!validations) return cleanedRecord;

  for (const validation of validations) {
    const fkValue = cleanedRecord[validation.field];
    if (fkValue) {
      // Get the model name from the validation.model
      const modelName = validation.field.replace('_id', ''); // Simple heuristic
      const exists = await checkForeignKeyExists(validation.model, modelName, fkValue);
      if (!exists) {
        if (validation.nullable) {
          // Remove the foreign key if it's optional and doesn't exist
          delete cleanedRecord[validation.field];
          // Also remove related name fields
          const nameField = validation.field.replace('_id', '_name');
          if (cleanedRecord[nameField]) {
            delete cleanedRecord[nameField];
          }
        } else {
          // Mark record as invalid by setting a flag
          cleanedRecord._skipRecord = true;
          cleanedRecord._skipReason = `Invalid FK: ${validation.field}=${fkValue}`;
          return cleanedRecord;
        }
      }
    }
  }

  return cleanedRecord;
}

// Generic seed function with optimized upsert handling
async function seedTable(tableName: string, prismaModel: any) {
  const data = readTableData(tableName);
  if (data.length === 0) {
    console.log(`⊘ ${tableName} - No data to seed`);
    return;
  }

  console.log(`\nSeeding ${tableName} (${data.length} records)...`);

  let successCount = 0;
  let errorCount = 0;

  // Initialize table summary
  tableSummary.set(tableName, { total: data.length, success: 0, errors: 0 });

  const uniqueFields = TABLE_UNIQUE_FIELDS[tableName] || [];
  const primaryKey = TABLE_PRIMARY_KEYS[tableName] || 'id';

  console.log(`  Primary key: ${primaryKey}`);
  if (uniqueFields.length > 0) {
    console.log(`  Unique fields: ${uniqueFields.join(', ')}`);
  }

  // Pre-fetch all existing records by ID for this table (optimization)
  const existingRecordsMap = new Map();
  const validIds = data.map((r) => r[primaryKey]).filter((id) => id !== undefined && id !== null);

  console.log(`  Valid IDs to check: ${validIds.length}`);

  if (validIds.length > 0) {
    const existingRecords = await prismaModel.findMany({
      where: {
        [primaryKey]: { in: validIds },
      },
    });
    existingRecords.forEach((r: any) => existingRecordsMap.set(r[primaryKey], r));
    console.log(`  Found ${existingRecords.length} existing records`);
  }

  let skippedCount = 0;
  for (let i = 0; i < data.length; i++) {
    let record = ensureRequiredFields(data[i], tableName, i);

    // Validate foreign keys and clean/skip invalid records
    record = await validateForeignKeys(record, tableName);

    // Skip records with invalid foreign keys
    if (record._skipRecord) {
      skippedCount++;
      // Only log first few skips to avoid spam
      if (skippedCount <= 5) {
        console.log(`  → SKIP (invalid FK) - ${record[primaryKey]}`);
      }
      continue;
    }

    // Remove the internal flag if it exists
    delete record._skipRecord;

    const recordPK = record[primaryKey];
    let operation = ''; // Declare outside try block for error logging
    try {
      // Try to use cached existing record first
      let shouldUpdate = existingRecordsMap.has(recordPK);

      if (!shouldUpdate && uniqueFields.length > 0) {
        // Check if a record with the same unique fields exists
        const whereConditions: any = {};
        for (const field of uniqueFields) {
          if (record[field] !== undefined && record[field] !== null) {
            whereConditions[field] = record[field];
          }
        }

        if (Object.keys(whereConditions).length > 0) {
          const existing = await prismaModel.findFirst({
            where: whereConditions,
          });
          if (existing) {
            shouldUpdate = true;
            operation = `UPDATE (found by unique fields: ${JSON.stringify(whereConditions)})`;
            console.log(`  → ${operation} - ${primaryKey}: ${recordPK}`);

            // Update the record data with the correct ID from the found record
            // Remove the primary key from update data to avoid conflicts
            const updateData = { ...record };
            delete updateData[primaryKey];

            await prismaModel.update({
              where: { [primaryKey]: existing[primaryKey] },
              data: updateData,
            });
            successCount++;
            continue;
          }
        }
      }

      if (shouldUpdate) {
        // Update existing record by primary key
        operation = `UPDATE (existing ${primaryKey})`;
        console.log(`  → ${operation} - ${recordPK}`);

        // Remove the primary key from update data to avoid conflicts
        const updateData = { ...record };
        delete updateData[primaryKey];

        await prismaModel.update({
          where: { [primaryKey]: recordPK },
          data: updateData,
        });
      } else {
        // Create new record
        operation = `CREATE (new record)`;
        console.log(`  → ${operation} - ${recordPK}`);

        await prismaModel.create({
          data: record,
        });
      }

      successCount++;
    } catch (error: any) {
      errorCount++;
      console.error(`\n  ✗ Error seeding ${tableName} record ${recordPK}:`);
      console.error(`     Operation: ${operation || 'Unknown'}`);
      console.error(`     Error type: ${error.constructor.name}`);
      console.error(`     Error code: ${error.code || 'N/A'}`);
      console.error(`     Message: ${error.message}`);

      // Log the full record data for debugging
      if (error.code === 'P2002' || error.code === 'P2003') {
        console.error(`     Failed record data:`, JSON.stringify(record, null, 2));
      }

      // Log meta information if available
      if (error.meta) {
        console.error(`     Meta:`, JSON.stringify(error.meta, null, 2));
      }

      // Track error globally for summary
      globalErrors.push({
        tableName,
        recordId: recordPK,
        operation: operation || 'Unknown',
        errorType: error.constructor.name,
        errorCode: error.code || 'N/A',
        message: error.message,
        recordData: (error.code === 'P2002' || error.code === 'P2003') ? record : undefined,
        meta: error.meta,
      });
    }
  }

  console.log(); // Empty line for readability

  // Log skip summary if any records were skipped
  if (skippedCount > 0) {
    console.log(`  ⊗ Skipped ${skippedCount} records with invalid foreign keys`);
  }

  // Update table summary
  const summary = tableSummary.get(tableName)!;
  summary.success = successCount;
  summary.errors = errorCount;

  if (errorCount === 0 && skippedCount === 0) {
    console.log(`✓ ${tableName} seeded successfully (${successCount} records)`);
  } else if (errorCount === 0) {
    console.log(`✓ ${tableName} seeded successfully (${successCount} records, ${skippedCount} skipped)`);
  } else {
    console.log(`⚠ ${tableName} partially seeded (${successCount} success, ${errorCount} errors, ${skippedCount} skipped)`);
    console.log(`  Failed ${errorCount} out of ${data.length} records`);
  }
}

// Print comprehensive footer summary
function printSummary(duration: string) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 SEEDING SUMMARY");
  console.log("=".repeat(80));

  // Calculate totals
  let totalRecords = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  // Print table-by-table summary
  console.log("\n📋 Table Summary:");
  console.log("-".repeat(80));
  console.log(`${"Table Name".padEnd(35)} | ${"Total".padStart(6)} | ${"Success".padStart(7)} | ${"Errors".padStart(6)} | Status`);
  console.log("-".repeat(80));

  for (const [tableName, summary] of tableSummary) {
    totalRecords += summary.total;
    totalSuccess += summary.success;
    totalErrors += summary.errors;

    const status = summary.errors === 0 ? "✓ OK" : "⚠ PARTIAL";
    const statusColor = summary.errors === 0 ? status : status;

    console.log(
      `${tableName.padEnd(35)} | ${summary.total.toString().padStart(6)} | ${summary.success.toString().padStart(7)} | ${summary.errors.toString().padStart(6)} | ${statusColor}`
    );
  }

  console.log("-".repeat(80));
  console.log(
    `${"TOTAL".padEnd(35)} | ${totalRecords.toString().padStart(6)} | ${totalSuccess.toString().padStart(7)} | ${totalErrors.toString().padStart(6)} |`
  );
  console.log("-".repeat(80));

  // Print error summary by type
  if (globalErrors.length > 0) {
    console.log("\n❌ ERROR SUMMARY:");
    console.log("=".repeat(80));

    // Group errors by error code
    const errorsByCode = new Map<string, ErrorDetail[]>();
    for (const error of globalErrors) {
      const code = error.errorCode;
      if (!errorsByCode.has(code)) {
        errorsByCode.set(code, []);
      }
      errorsByCode.get(code)!.push(error);
    }

    // Print errors grouped by code
    for (const [errorCode, errors] of errorsByCode) {
      console.log(`\n🔴 Error Code: ${errorCode} (${errors.length} occurrences)`);
      console.log("-".repeat(80));

      // Show first 10 errors of each type in detail
      const displayLimit = 10;
      for (let i = 0; i < Math.min(errors.length, displayLimit); i++) {
        const error = errors[i];
        console.log(`\n  Table: ${error.tableName}`);
        console.log(`  Record ID: ${error.recordId}`);
        console.log(`  Operation: ${error.operation}`);
        console.log(`  Error Type: ${error.errorType}`);
        console.log(`  Message: ${error.message}`);

        if (error.meta) {
          console.log(`  Meta: ${JSON.stringify(error.meta, null, 2)}`);
        }

        if (error.recordData) {
          console.log(`  Failed Record Data:`);
          console.log(`  ${JSON.stringify(error.recordData, null, 2).split('\n').join('\n  ')}`);
        }
      }

      if (errors.length > displayLimit) {
        console.log(`\n  ... and ${errors.length - displayLimit} more errors of this type`);
      }
    }

    // Print summary of affected tables
    console.log("\n" + "=".repeat(80));
    console.log("📋 AFFECTED TABLES:");
    console.log("-".repeat(80));

    const tableErrors = new Map<string, number>();
    for (const error of globalErrors) {
      tableErrors.set(error.tableName, (tableErrors.get(error.tableName) || 0) + 1);
    }

    for (const [tableName, count] of Array.from(tableErrors.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${tableName}: ${count} error${count > 1 ? 's' : ''}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  if (totalErrors === 0) {
    console.log("✅ Database seeding completed successfully!");
  } else {
    console.log("⚠️  Database seeding completed with errors!");
    console.log(`   Success Rate: ${((totalSuccess / totalRecords) * 100).toFixed(2)}%`);
  }
  console.log(`⏱  Duration: ${duration} seconds`);
  console.log(`📊 Total Records: ${totalRecords} | Success: ${totalSuccess} | Errors: ${totalErrors}`);
  console.log("=".repeat(80));
}

// Main seeding function with proper order (respecting foreign keys)
async function main() {
  console.log("Starting database seeding from A01 data...\n");
  console.log("=".repeat(60));

  const startTime = Date.now();

  try {
    // Level 1: Base reference data (no dependencies)
    console.log("\n📦 Level 1: Base Reference Data");
    await seedTable("tb_currency", prisma.tb_currency);
    await seedTable("tb_unit", prisma.tb_unit);
    await seedTable("tb_credit_term", prisma.tb_credit_term);
    await seedTable("tb_extra_cost_type", prisma.tb_extra_cost_type);
    await seedTable("tb_vendor_business_type", prisma.tb_vendor_business_type);

    // Level 2: Reference data with level 1 dependencies
    console.log("\n📦 Level 2: Extended Reference Data");
    await seedTable("tb_department", prisma.tb_department);
    await seedTable("tb_delivery_point", prisma.tb_delivery_point);
    await seedTable("tb_location", prisma.tb_location);
    await seedTable("tb_product_category", prisma.tb_product_category);

    // Level 3: More complex reference data
    console.log("\n📦 Level 3: Complex Reference Data");
    await seedTable("tb_product_sub_category", prisma.tb_product_sub_category);
    await seedTable("tb_product_item_group", prisma.tb_product_item_group);
    await seedTable("tb_vendor", prisma.tb_vendor);
    await seedTable("tb_workflow", prisma.tb_workflow);

    // Level 4: Child records of vendors
    console.log("\n📦 Level 4: Vendor Related Data");
    await seedTable("tb_vendor_address", prisma.tb_vendor_address);
    await seedTable("tb_vendor_contact", prisma.tb_vendor_contact);

    // Level 5: Products
    console.log("\n📦 Level 5: Product Data");
    await seedTable("tb_product", prisma.tb_product);

    // Level 6: Product-dependent data
    console.log("\n📦 Level 6: Product Dependent Data");
    await seedTable("tb_unit_conversion", prisma.tb_unit_conversion);
    await seedTable("tb_product_location", prisma.tb_product_location);

    // Level 7: User-related data
    console.log("\n📦 Level 7: User Related Data");
    await seedTable("tb_department_user", prisma.tb_department_user);
    await seedTable("tb_user_location", prisma.tb_user_location);
    await seedTable("tb_user_profile", prisma.tb_user_profile);

    // Level 8: Configuration
    console.log("\n📦 Level 8: System Configuration");
    await seedTable("tb_config_running_code", prisma.tb_config_running_code);
    await seedTable("tb_application_config", prisma.tb_application_config);

    // Level 9: Transactional data
    console.log("\n📦 Level 9: Transactional Data");
    await seedTable("tb_purchase_request", prisma.tb_purchase_request);
    await seedTable("tb_purchase_request_detail", prisma.tb_purchase_request_detail);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print comprehensive summary
    printSummary(duration);
  } catch (error) {
    console.error("\n❌ Error during seeding:", error);

    // Still print summary even if there was a fatal error
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    printSummary(duration);

    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
