# micro-report Service Design

> **Status:** proposed — not yet implemented.
>
> This design document captures intent; no `apps/micro-report/` service exists in the repo as of 2026-04-20. Keep for reference when planning the service.

## Overview

micro-report เป็น NestJS microservice สำหรับสร้าง report ทุกประเภทในระบบ Carmen ERP
รองรับทั้ง on-demand (sync) และ async report generation ผ่าน queue

- **TCP Port**: 5015 (inter-service RPC)
- **HTTP Port**: 6015 (health check / direct access)
- **Runtime**: Node.js 22 + Bun
- **Framework**: NestJS 11

## Architecture Overview

```
                         backend-gateway (:4000)
                                |
                    +-----------+-----------+
                    |                       |
               TCP:5015                TCP:5015
              (on-demand)            (async request)
                    |                       |
                    v                       v
  +-----------------------------------------------------+
  |                  micro-report                        |
  |                                                      |
  |  +----------------+     +-------------------------+  |
  |  | Report         |     | Report Queue            |  |
  |  | Controller     |     | (BullMQ + Redis)        |  |
  |  | (TCP handlers) |     |                         |  |
  |  +-------+--------+     +------------+------------+  |
  |          |                           |               |
  |          v                           v               |
  |  +-------+--------+     +------------+------------+  |
  |  | Report         |     | Report Worker           |  |
  |  | Service        |     | (Bull Processor)        |  |
  |  | (Business      |     |                         |  |
  |  |  Logic)        |     | - PDF Generation        |  |
  |  +-------+--------+     | - Excel Generation      |  |
  |          |               | - CSV Export            |  |
  |          |               +------------+------------+  |
  |          |                            |               |
  |          v                            v               |
  |  +-------+----------------------------+------------+  |
  |  |              Data Layer                         |  |
  |  |                                                 |  |
  |  |  +-------------+  +-----------+  +-----------+  |  |
  |  |  | Prisma      |  | Report    |  | Template  |  |  |
  |  |  | Tenant DB   |  | Builder   |  | Engine    |  |  |
  |  |  | (read-only  |  | (Agg.     |  | (Handle-  |  |  |
  |  |  |  queries)   |  |  Queries) |  |  bars)    |  |  |
  |  |  +-------------+  +-----------+  +-----------+  |  |
  |  +-------------------------------------------------+  |
  |                         |                              |
  +-------------------------|------------------------------+
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
    +----------+     +----------+     +------------+
    | AWS RDS  |     | Redis    |     | micro-file |
    | (Tenant  |     | (Queue + |     | (S3 upload)|
    |  Schema) |     |  Cache)  |     | TCP:5007   |
    +----------+     +----------+     +------------+
```

## Report Categories & Types

```
  +===========================================================================+
  |                        REPORT CATALOG                                     |
  +===========================================================================+
  |                                                                           |
  |  1. INVENTORY REPORTS                                                     |
  |  ====================                                                     |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Stock On-Hand Summary        | inventory_transaction| PDF, Excel     | |
  |  | Stock On-Hand by Location    | inventory_transaction| PDF, Excel     | |
  |  | Stock Movement (In/Out)      | stock_in, stock_out  | PDF, Excel     | |
  |  | Stock Valuation (FIFO/AVG)   | cost_layer, period   | PDF, Excel     | |
  |  | Transfer Report              | transfer             | PDF, Excel     | |
  |  | Stock Count Variance         | count_stock          | PDF, Excel     | |
  |  | Slow-Moving / Dead Stock     | inventory_transaction| PDF, Excel     | |
  |  | Reorder Point Alert          | product, inventory   | PDF, Excel     | |
  |  | Period Closing Summary       | period, snapshot     | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  |  2. PROCUREMENT REPORTS                                                   |
  |  ======================                                                   |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Purchase Request Summary     | purchase_request     | PDF, Excel     | |
  |  | Purchase Order Summary       | purchase_order       | PDF, Excel     | |
  |  | PO by Vendor                 | purchase_order       | PDF, Excel     | |
  |  | PO by Department             | purchase_order       | PDF, Excel     | |
  |  | GRN Summary                  | good_received_note   | PDF, Excel     | |
  |  | GRN vs PO Variance           | grn + po             | PDF, Excel     | |
  |  | Vendor Performance           | grn, po, credit_note | PDF, Excel     | |
  |  | Credit Note Summary          | credit_note          | PDF, Excel     | |
  |  | Outstanding PO               | purchase_order       | PDF, Excel     | |
  |  | Procurement Spend Analysis   | po, grn              | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  |  3. RECIPE & COSTING REPORTS                                              |
  |  ============================                                             |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Recipe Costing Sheet         | recipe, ingredient   | PDF            | |
  |  | Recipe Card (Kitchen Print)  | recipe, steps        | PDF            | |
  |  | Food Cost Analysis           | recipe, pricing_hist | PDF, Excel     | |
  |  | Menu Costing                 | recipe, menu         | PDF, Excel     | |
  |  | Ingredient Usage             | recipe_ingredient    | PDF, Excel     | |
  |  | Margin Analysis              | recipe (costs/price) | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  |  4. VENDOR REPORTS                                                        |
  |  =================                                                        |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Vendor Master List           | vendor               | PDF, Excel     | |
  |  | Vendor Price Comparison      | pricelist            | PDF, Excel     | |
  |  | Vendor Spend Summary         | po, grn              | PDF, Excel     | |
  |  | Vendor Contact Directory     | vendor_contact       | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  |  5. FINANCIAL REPORTS                                                     |
  |  ====================                                                     |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Cost Center Report           | department, po       | PDF, Excel     | |
  |  | Budget vs Actual             | custom + po + grn    | PDF, Excel     | |
  |  | Journal Voucher Report       | jv_header, jv_detail | PDF, Excel     | |
  |  | Extra Cost Summary           | extra_cost           | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  |  6. OPERATIONAL REPORTS                                                   |
  |  ======================                                                   |
  |  +---------------------------------------------------------------------+ |
  |  | Report Name                  | Data Source          | Output Format  | |
  |  |------------------------------|----------------------|----------------| |
  |  | Store Requisition Summary    | store_requisition    | PDF, Excel     | |
  |  | Activity Log / Audit Trail   | tb_activity          | PDF, Excel, CSV| |
  |  | Workflow Status Dashboard    | purchase_* workflows | PDF, Excel     | |
  |  | User Action Report           | user_action JSON     | PDF, Excel     | |
  |  +---------------------------------------------------------------------+ |
  |                                                                           |
  +===========================================================================+
```

## Service Directory Structure

```
apps/micro-report/
  +-- src/
  |   +-- main.ts                           # Bootstrap TCP:5015 + HTTP:6015
  |   +-- app.module.ts                     # Root module
  |   +-- app.controller.ts                 # GET / , GET /health
  |   +-- app.service.ts
  |   +-- libs/
  |   |   +-- config.env.ts                 # Zod-validated env config
  |   |   +-- config.loki.ts                # Winston + Loki logging
  |   |
  |   +-- common/
  |   |   +-- common.module.ts
  |   |   +-- http/
  |   |   |   +-- base-microservice-controller.ts
  |   |   +-- result/
  |   |   |   +-- result.ts                 # Result<T> monad
  |   |   |   +-- error.ts                  # AppError, ErrorCode
  |   |   +-- decorators/
  |   |   |   +-- try-catch.decorator.ts    # @TryCatch
  |   |   +-- helpers/
  |   |   |   +-- backend.logger.ts
  |   |   |   +-- paginate.helper.ts
  |   |   +-- interfaces/
  |   |   |   +-- microservice-payload.interface.ts
  |   |   +-- std-response/
  |   |       +-- std-response.ts
  |   |
  |   +-- tenant/
  |   |   +-- tenant.module.ts
  |   |   +-- tenant.service.ts             # Per-tenant Prisma init
  |   |
  |   +-- queue/
  |   |   +-- queue.module.ts               # BullMQ configuration
  |   |   +-- report-queue.producer.ts      # Add jobs to queue
  |   |   +-- report-queue.consumer.ts      # Process jobs (Bull processor)
  |   |   +-- report-queue.const.ts         # Queue names, job options
  |   |
  |   +-- generator/
  |   |   +-- generator.module.ts
  |   |   +-- pdf.generator.ts              # pdfmake / Puppeteer
  |   |   +-- excel.generator.ts            # ExcelJS
  |   |   +-- csv.generator.ts              # fast-csv / papaparse
  |   |   +-- templates/
  |   |       +-- inventory/
  |   |       |   +-- stock-on-hand.hbs     # Handlebars templates
  |   |       |   +-- stock-movement.hbs
  |   |       |   +-- stock-valuation.hbs
  |   |       +-- procurement/
  |   |       |   +-- purchase-order.hbs
  |   |       |   +-- vendor-performance.hbs
  |   |       +-- recipe/
  |   |       |   +-- recipe-card.hbs
  |   |       |   +-- recipe-costing.hbs
  |   |       +-- common/
  |   |           +-- header.hbs            # Shared header/footer
  |   |           +-- footer.hbs
  |   |           +-- table.hbs
  |   |
  |   +-- report/
  |       +-- report.module.ts              # Main report module
  |       +-- report.controller.ts          # TCP @MessagePattern handlers
  |       +-- report.service.ts             # Report orchestration
  |       +-- report-status.service.ts      # Track async job status
  |       |
  |       +-- dto/
  |       |   +-- report-request.dto.ts     # Zod schemas for report params
  |       |   +-- report-response.dto.ts    # Response serializers
  |       |
  |       +-- interface/
  |       |   +-- report.interface.ts       # TypeScript interfaces
  |       |
  |       +-- builders/                     # Data aggregation per report type
  |       |   +-- builder.interface.ts      # IReportBuilder contract
  |       |   +-- inventory/
  |       |   |   +-- stock-on-hand.builder.ts
  |       |   |   +-- stock-movement.builder.ts
  |       |   |   +-- stock-valuation.builder.ts
  |       |   |   +-- stock-count-variance.builder.ts
  |       |   +-- procurement/
  |       |   |   +-- po-summary.builder.ts
  |       |   |   +-- grn-summary.builder.ts
  |       |   |   +-- vendor-performance.builder.ts
  |       |   |   +-- procurement-spend.builder.ts
  |       |   +-- recipe/
  |       |   |   +-- recipe-costing.builder.ts
  |       |   |   +-- food-cost-analysis.builder.ts
  |       |   |   +-- menu-costing.builder.ts
  |       |   +-- vendor/
  |       |   |   +-- vendor-master.builder.ts
  |       |   |   +-- vendor-spend.builder.ts
  |       |   +-- financial/
  |       |       +-- cost-center.builder.ts
  |       |       +-- journal-voucher.builder.ts
  |       |
  |       +-- scheduler/
  |           +-- report-scheduler.service.ts  # Schedule recurring reports
  |
  +-- test/
  |   +-- report.service.spec.ts
  |   +-- builders/
  |       +-- stock-on-hand.builder.spec.ts
  |
  +-- package.json
  +-- tsconfig.json
  +-- nest-cli.json
  +-- Dockerfile
  +-- .env.example
```

## Core Interfaces & Types

```typescript
// ============================================================
// src/report/interface/report.interface.ts
// ============================================================

/** Report generation mode */
export type ReportMode = 'sync' | 'async';

/** Output format */
export type ReportFormat = 'pdf' | 'excel' | 'csv';

/** Report category aligned with Carmen modules */
export type ReportCategory =
  | 'inventory'
  | 'procurement'
  | 'recipe'
  | 'vendor'
  | 'financial'
  | 'operational';

/** All supported report types */
export type ReportType =
  // Inventory
  | 'stock-on-hand'
  | 'stock-on-hand-by-location'
  | 'stock-movement'
  | 'stock-valuation'
  | 'transfer-report'
  | 'stock-count-variance'
  | 'slow-moving-stock'
  | 'reorder-alert'
  | 'period-closing'
  // Procurement
  | 'pr-summary'
  | 'po-summary'
  | 'po-by-vendor'
  | 'po-by-department'
  | 'grn-summary'
  | 'grn-vs-po-variance'
  | 'vendor-performance'
  | 'credit-note-summary'
  | 'outstanding-po'
  | 'procurement-spend'
  // Recipe
  | 'recipe-costing'
  | 'recipe-card'
  | 'food-cost-analysis'
  | 'menu-costing'
  | 'ingredient-usage'
  | 'margin-analysis'
  // Vendor
  | 'vendor-master'
  | 'vendor-price-comparison'
  | 'vendor-spend'
  | 'vendor-contacts'
  // Financial
  | 'cost-center'
  | 'budget-vs-actual'
  | 'journal-voucher'
  | 'extra-cost'
  // Operational
  | 'store-requisition'
  | 'activity-log'
  | 'workflow-status'
  | 'user-action';

/** Report job status */
export type ReportJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

/** Request to generate a report */
export interface IReportRequest {
  report_type: ReportType;
  format: ReportFormat;
  mode: ReportMode;
  filters: IReportFilters;
  options?: IReportOptions;
}

/** Common filters for all reports */
export interface IReportFilters {
  date_from?: string;        // ISO date
  date_to?: string;          // ISO date
  location_ids?: string[];   // Filter by locations
  department_ids?: string[];
  vendor_ids?: string[];
  product_ids?: string[];
  category_ids?: string[];
  status?: string[];         // Document status filter
  period_id?: string;        // Accounting period
  currency_id?: string;
}

/** Report rendering options */
export interface IReportOptions {
  title?: string;            // Custom title override
  locale?: string;           // e.g., 'th-TH', 'en-US'
  timezone?: string;         // e.g., 'Asia/Bangkok'
  page_size?: 'A4' | 'A3' | 'letter';
  orientation?: 'portrait' | 'landscape';
  include_summary?: boolean;
  group_by?: string;         // Field to group by
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/** Report generation result */
export interface IReportResult {
  id: string;                // Report job ID
  report_type: ReportType;
  format: ReportFormat;
  status: ReportJobStatus;
  file_url?: string;         // S3 URL when completed
  file_size?: number;        // bytes
  row_count?: number;
  generated_at?: string;     // ISO datetime
  error_message?: string;    // If failed
  expires_at?: string;       // S3 pre-signed URL expiry
}

/** Report builder contract */
export interface IReportBuilder {
  /** Fetch and aggregate data from DB */
  buildData(
    prisma: PrismaClient,
    filters: IReportFilters,
  ): Promise<IReportData>;
}

/** Structured report data output from builder */
export interface IReportData {
  title: string;
  subtitle?: string;
  generated_at: string;
  filters_applied: Record<string, string>;
  summary?: Record<string, number | string>;
  columns: IReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
}

export interface IReportColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'decimal' | 'date' | 'boolean';
  width?: number;            // For Excel column width
  align?: 'left' | 'center' | 'right';
  format?: string;           // e.g., '#,##0.00' for numbers
}
```

## Message Patterns (TCP API)

```typescript
// ============================================================
// Gateway -> micro-report Message Patterns
// ============================================================

// On-demand (sync) report generation - returns file buffer
{ cmd: 'report.generate',           service: 'report' }

// Async report - queues job, returns job ID
{ cmd: 'report.generate-async',     service: 'report' }

// Check async job status
{ cmd: 'report.job-status',         service: 'report' }

// Download completed report (returns S3 pre-signed URL)
{ cmd: 'report.download',           service: 'report' }

// Cancel a queued/processing job
{ cmd: 'report.cancel-job',         service: 'report' }

// List available report types with metadata
{ cmd: 'report.list-types',         service: 'report' }

// List report history for tenant
{ cmd: 'report.history',            service: 'report' }

// Schedule a recurring report
{ cmd: 'report.schedule',           service: 'report' }

// List scheduled reports
{ cmd: 'report.schedule-list',      service: 'report' }

// Delete a schedule
{ cmd: 'report.schedule-delete',    service: 'report' }


// ============================================================
// micro-cronjob -> micro-report (scheduled triggers)
// ============================================================

// Triggered by cron at scheduled time
{ cmd: 'report.execute-scheduled',  service: 'report' }
```

## Gateway Integration

### Gateway Route Module

```
apps/backend-gateway/src/application/report/
  +-- report.module.ts
  +-- report.controller.ts
  +-- report.service.ts
```

### Gateway REST Endpoints

```
POST   /api/:bu_code/report/generate            # Sync generate (small reports)
POST   /api/:bu_code/report/generate-async       # Async generate (large reports)
GET    /api/:bu_code/report/job/:job_id/status   # Check job status
GET    /api/:bu_code/report/job/:job_id/download # Download result
DELETE /api/:bu_code/report/job/:job_id          # Cancel job
GET    /api/:bu_code/report/types                # List available report types
GET    /api/:bu_code/report/history              # Report generation history

POST   /api/:bu_code/report/schedule             # Create scheduled report
GET    /api/:bu_code/report/schedule             # List schedules
DELETE /api/:bu_code/report/schedule/:id         # Delete schedule
```

## Report Generation Flow

### Sync Flow (Small Reports < 10,000 rows)

```
  Client                Gateway              micro-report           RDS
    |                      |                      |                  |
    | POST /report/generate|                      |                  |
    |--------------------->|                      |                  |
    |                      | TCP: report.generate |                  |
    |                      |--------------------->|                  |
    |                      |                      | SELECT ...       |
    |                      |                      |----------------->|
    |                      |                      |<-- rows ---------|
    |                      |                      |                  |
    |                      |                      | Build report data|
    |                      |                      | Generate PDF/XLSX|
    |                      |                      |                  |
    |                      |<-- { file_buffer } --|                  |
    |<-- 200 + file -------|                      |                  |
    |                      |                      |                  |

  Timeout: 30 seconds
  Max rows: 10,000
```

### Async Flow (Large Reports > 10,000 rows)

```
  Client          Gateway        micro-report       Redis/Bull     Worker       S3
    |                |                |                  |            |          |
    | POST /generate-async           |                  |            |          |
    |--------------->|                |                  |            |          |
    |                | TCP: generate-async               |            |          |
    |                |--------------->|                  |            |          |
    |                |                | addJob()         |            |          |
    |                |                |----------------->|            |          |
    |                |<-- { job_id }--|                  |            |          |
    |<-- 202 --------|                |                  |            |          |
    |                |                |                  |            |          |
    |                |                |                  | process()  |          |
    |                |                |                  |----------->|          |
    |                |                |                  |            | query DB |
    |                |                |                  |            | build    |
    |                |                |                  |            | generate |
    |                |                |                  |            |          |
    |                |                |                  |            | upload() |
    |                |                |                  |            |--------->|
    |                |                |                  |            |<-- url --|
    |                |                |                  |<-- done ---|          |
    |                |                |                  |            |          |
    | GET /job/:id/status             |                  |            |          |
    |--------------->|                |                  |            |          |
    |                | TCP: job-status|                  |            |          |
    |                |--------------->|                  |            |          |
    |                |                | getJob(id)       |            |          |
    |                |                |----------------->|            |          |
    |                |<-- { status: 'completed', url } --|            |          |
    |<-- 200 --------|                |                  |            |          |
    |                |                |                  |            |          |
    | GET /job/:id/download           |                  |            |          |
    |--------------->|                |                  |            |          |
    |<-- 302 redirect to S3 pre-signed URL                           |          |
```

## Builder Pattern (Data Aggregation)

```typescript
// ============================================================
// src/report/builders/builder.interface.ts
// ============================================================

export interface IReportBuilder {
  buildData(
    prisma: PrismaClient,
    filters: IReportFilters,
  ): Promise<IReportData>;
}

// ============================================================
// src/report/builders/inventory/stock-on-hand.builder.ts
// ============================================================

@Injectable()
export class StockOnHandBuilder implements IReportBuilder {

  async buildData(
    prisma: PrismaClient,
    filters: IReportFilters,
  ): Promise<IReportData> {

    // 1. Query: Aggregate current stock by product + location
    const rows = await prisma.tb_inventory_transaction_detail.groupBy({
      by: ['product_id', 'location_id'],
      _sum: { qty: true, total_cost: true },
      where: {
        tb_inventory_transaction: {
          created_at: {
            gte: filters.date_from ? new Date(filters.date_from) : undefined,
            lte: filters.date_to ? new Date(filters.date_to) : undefined,
          },
          deleted_at: null,
        },
        ...(filters.location_ids?.length && {
          location_id: { in: filters.location_ids },
        }),
        ...(filters.product_ids?.length && {
          product_id: { in: filters.product_ids },
        }),
      },
    });

    // 2. Enrich with product/location names (batch lookup)
    const productIds = [...new Set(rows.map(r => r.product_id))];
    const locationIds = [...new Set(rows.map(r => r.location_id))];

    const [products, locations] = await Promise.all([
      prisma.tb_product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, code: true },
      }),
      prisma.tb_location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const productMap = new Map(products.map(p => [p.id, p]));
    const locationMap = new Map(locations.map(l => [l.id, l]));

    // 3. Build structured output
    const enrichedRows = rows.map(row => ({
      product_code: productMap.get(row.product_id)?.code ?? '',
      product_name: productMap.get(row.product_id)?.name ?? '',
      location_code: locationMap.get(row.location_id)?.code ?? '',
      location_name: locationMap.get(row.location_id)?.name ?? '',
      qty_on_hand: row._sum.qty?.toNumber() ?? 0,
      total_cost: row._sum.total_cost?.toNumber() ?? 0,
      avg_unit_cost: row._sum.qty?.toNumber()
        ? (row._sum.total_cost?.toNumber() ?? 0) / row._sum.qty.toNumber()
        : 0,
    }));

    // 4. Summary
    const totalQty = enrichedRows.reduce((sum, r) => sum + r.qty_on_hand, 0);
    const totalCost = enrichedRows.reduce((sum, r) => sum + r.total_cost, 0);

    return {
      title: 'Stock On-Hand Summary',
      generated_at: new Date().toISOString(),
      filters_applied: {
        ...(filters.date_from && { 'From': filters.date_from }),
        ...(filters.date_to && { 'To': filters.date_to }),
      },
      summary: {
        total_products: productIds.length,
        total_locations: locationIds.length,
        total_qty: totalQty,
        total_value: totalCost,
      },
      columns: [
        { key: 'product_code',  label: 'Product Code',  type: 'string',  width: 15 },
        { key: 'product_name',  label: 'Product Name',  type: 'string',  width: 30 },
        { key: 'location_code', label: 'Location Code', type: 'string',  width: 15 },
        { key: 'location_name', label: 'Location',      type: 'string',  width: 25 },
        { key: 'qty_on_hand',   label: 'Qty On Hand',   type: 'decimal', width: 15, align: 'right', format: '#,##0.00' },
        { key: 'total_cost',    label: 'Total Cost',    type: 'decimal', width: 15, align: 'right', format: '#,##0.00' },
        { key: 'avg_unit_cost', label: 'Avg Unit Cost', type: 'decimal', width: 15, align: 'right', format: '#,##0.00' },
      ],
      rows: enrichedRows,
      totals: {
        qty_on_hand: totalQty,
        total_cost: totalCost,
      },
    };
  }
}
```

## Database Tables (New - Platform Schema)

```
เพิ่มในฝั่ง Tenant Schema (prisma-shared-schema-tenant)

+-----------------------------------------------------------------------+
|  tb_report_job                                                        |
|-----------------------------------------------------------------------|
|  id              UUID     PK  gen_random_uuid()                       |
|  report_type     String       e.g., 'stock-on-hand'                   |
|  report_category String       e.g., 'inventory'                       |
|  format          String       'pdf' | 'excel' | 'csv'                 |
|  status          Enum         queued | processing | completed | failed |
|  filters         JsonB        Request filters snapshot                 |
|  options         JsonB        Report options snapshot                   |
|  file_url        String?      S3 URL when completed                    |
|  file_name       String?      e.g., 'stock-on-hand-2026-03-05.pdf'   |
|  file_size       Int?         File size in bytes                       |
|  row_count       Int?         Number of data rows                      |
|  error_message   String?      Error details if failed                  |
|  started_at      DateTime?    When processing began                    |
|  completed_at    DateTime?    When generation finished                  |
|  expires_at      DateTime?    S3 URL expiry                            |
|  duration_ms     Int?         Processing duration in ms                |
|  requested_by_id UUID         User who requested                       |
|  created_at      DateTime     default: now()                           |
|  created_by_id   UUID                                                  |
|  updated_at      DateTime     default: now()                           |
|  updated_by_id   UUID                                                  |
|  deleted_at      DateTime?    Soft delete                              |
|  deleted_by_id   UUID?                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|  tb_report_schedule                                                   |
|-----------------------------------------------------------------------|
|  id              UUID     PK  gen_random_uuid()                       |
|  name            String       Schedule name                            |
|  report_type     String       e.g., 'po-summary'                      |
|  format          String       'pdf' | 'excel'                         |
|  cron_expression String       e.g., '0 8 * * 1' (Mon 8AM)            |
|  filters         JsonB        Saved filter template                    |
|  options         JsonB        Saved report options                     |
|  recipients      JsonB        Email recipients list                    |
|  is_active       Boolean      default: true                            |
|  last_run_at     DateTime?    Last execution time                      |
|  next_run_at     DateTime?    Calculated next run                      |
|  created_at      DateTime     default: now()                           |
|  created_by_id   UUID                                                  |
|  updated_at      DateTime     default: now()                           |
|  updated_by_id   UUID                                                  |
|  deleted_at      DateTime?                                             |
|  deleted_by_id   UUID?                                                 |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|  tb_report_template                                                   |
|-----------------------------------------------------------------------|
|  id              UUID     PK  gen_random_uuid()                       |
|  name            String       Template name                            |
|  report_type     String       Linked report type                       |
|  description     String?                                               |
|  filters         JsonB        Pre-configured filters                   |
|  options         JsonB        Pre-configured options                   |
|  is_default      Boolean      default: false                           |
|  is_active       Boolean      default: true                            |
|  created_at      DateTime     default: now()                           |
|  created_by_id   UUID                                                  |
|  updated_at      DateTime     default: now()                           |
|  updated_by_id   UUID                                                  |
|  deleted_at      DateTime?                                             |
|  deleted_by_id   UUID?                                                 |
+-----------------------------------------------------------------------+
```

## Dependencies (package.json)

```json
{
  "dependencies": {
    // NestJS Core
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/microservices": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",

    // Queue (Async report generation)
    "@nestjs/bullmq": "^11.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0",

    // Report Generation
    "pdfmake": "^0.2.0",              // PDF generation
    "exceljs": "^4.4.0",              // Excel generation
    "fast-csv": "^5.0.0",             // CSV export
    "handlebars": "^4.7.0",           // Template engine (PDF layouts)

    // Prisma
    "@repo/prisma-shared-schema-tenant": "workspace:*",
    "@repo/prisma-shared-schema-platform": "workspace:*",

    // Shared packages
    "@repo/log-events-library": "workspace:*",

    // Validation
    "zod": "^3.23.0",
    "nestjs-zod": "^4.0.0",

    // Logging
    "nest-winston": "^1.10.0",
    "winston": "^3.14.0",
    "winston-loki": "^6.1.0",

    // Utilities
    "rxjs": "^7.8.0",
    "dayjs": "^1.11.0"
  }
}
```

## Environment Configuration

```bash
# .env.example

# Service ports
REPORT_SERVICE_HOST=0.0.0.0
REPORT_SERVICE_PORT=5015
REPORT_SERVICE_HTTP_PORT=6015

# Database
SYSTEM_DATABASE_URL=postgresql://user:pass@host:5432/platform
SYSTEM_DIRECT_URL=postgresql://user:pass@host:5432/platform

# Redis (for BullMQ queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Service (for S3 upload)
FILE_SERVICE_HOST=localhost
FILE_SERVICE_PORT=5007

# Notification Service (report-ready alerts)
NOTIFICATION_SERVICE_HOST=localhost
NOTIFICATION_SERVICE_PORT=5006

# Report settings
REPORT_SYNC_MAX_ROWS=10000
REPORT_ASYNC_TTL_HOURS=24
REPORT_S3_BUCKET=carmen-reports

# Logging
LOKI_HOST=http://localhost:3100
LOKI_BASIC_AUTH=
LOKI_LABEL_APP=micro-report

# Monitoring
SENTRY_DSN=
```

## Dockerfile

```dockerfile
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY package.json .
COPY bun.lock .
COPY tsconfig.json .
COPY turbo.json .

COPY packages ./packages
COPY apps/micro-report ./apps/micro-report

RUN bun install

WORKDIR /app/apps/micro-report
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY package.json .
COPY bun.lock .
COPY tsconfig.json .

COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/micro-report/tsconfig.json ./apps/micro-report/
COPY --from=builder /app/apps/micro-report/package.json ./apps/micro-report/
COPY --from=builder /app/apps/micro-report/dist ./apps/micro-report/dist

ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/micro-report

EXPOSE 5015
EXPOSE 6015

CMD ["bun", "start:prod"]
```

## K8s Integration

```
  carmen-shared namespace:                carmen-tenant-{name} namespace:
  +-----------------------+               +---------------------------+
  | backend-gateway       |  TCP:5015     | micro-report              |
  | (routes /report/*)    |-------------->| (per-tenant instance)     |
  +-----------------------+               +---------------------------+
                                                    |
  +-----------------------+               +---------v---------+
  | micro-cronjob         |  TCP:5015     | Redis (BullMQ)    |
  | (scheduled triggers)  |-------------->| report-queue      |
  +-----------------------+               +-------------------+
                                                    |
                                          +---------v---------+
                                          | Report Worker     |
                                          | (same pod or      |
                                          |  separate deploy) |
                                          +-------------------+
                                                    |
                                     +--------------+-------------+
                                     |              |             |
                                     v              v             v
                               +---------+   +-----------+  +--------+
                               | RDS     |   | micro-file|  | micro- |
                               | (query) |   | (S3 save) |  | notif. |
                               +---------+   +-----------+  | (alert)|
                                                             +--------+
```

## Inter-Service Communication Map

```
  +===========================================================================+
  |             micro-report Communication                                    |
  +===========================================================================+
  |                                                                           |
  |  INBOUND (receives from):                                                |
  |  +-------------------------------------------------------------------+   |
  |  | Source              | Transport | Pattern                         |   |
  |  |---------------------|-----------|--------------------------------|   |
  |  | backend-gateway     | TCP:5015  | report.generate                |   |
  |  | backend-gateway     | TCP:5015  | report.generate-async          |   |
  |  | backend-gateway     | TCP:5015  | report.job-status              |   |
  |  | backend-gateway     | TCP:5015  | report.download                |   |
  |  | backend-gateway     | TCP:5015  | report.cancel-job              |   |
  |  | backend-gateway     | TCP:5015  | report.list-types              |   |
  |  | backend-gateway     | TCP:5015  | report.history                 |   |
  |  | backend-gateway     | TCP:5015  | report.schedule                |   |
  |  | backend-gateway     | TCP:5015  | report.schedule-list           |   |
  |  | backend-gateway     | TCP:5015  | report.schedule-delete         |   |
  |  | micro-cronjob       | TCP:5015  | report.execute-scheduled       |   |
  |  +-------------------------------------------------------------------+   |
  |                                                                           |
  |  OUTBOUND (sends to):                                                    |
  |  +-------------------------------------------------------------------+   |
  |  | Target              | Transport | Purpose                        |   |
  |  |---------------------|-----------|--------------------------------|   |
  |  | micro-file          | TCP:5007  | Upload generated file to S3    |   |
  |  | micro-notification  | TCP:5006  | Notify user report is ready    |   |
  |  | AWS RDS             | Prisma    | Query tenant data (read-only)  |   |
  |  | Redis               | ioredis   | BullMQ queue + report cache    |   |
  |  +-------------------------------------------------------------------+   |
  |                                                                           |
  +===========================================================================+
```

## Turbo Pipeline Update

```jsonc
// turbo.json - เพิ่ม micro-report ใน pipeline
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "db:generate"]
    },
    "dev": {
      "dependsOn": ["build:package"]
    },
    "dev:report": {
      "dependsOn": ["build:package"]
    }
  }
}
```

## Gateway ENV Update

```bash
# เพิ่มใน apps/backend-gateway/.env
REPORT_SERVICE_HOST=api-micro-report
REPORT_SERVICE_PORT=5015
REPORT_SERVICE_HTTP_PORT=6015
```

## Gateway Dockerfile ENV Update

```dockerfile
# เพิ่มใน apps/backend-gateway/Dockerfile
ENV REPORT_SERVICE_HOST=api-micro-report
ENV REPORT_SERVICE_PORT=5015
ENV REPORT_SERVICE_HTTP_PORT=6015
```

## Docker Compose Update

```yaml
# เพิ่มใน docker-compose.yml และ docker-compose.dev.yml
api-micro-report:
  image: ${ECR_REGISTRY}/${IMAGE_PREFIX}-micro-report:${IMAGE_TAG:-latest}
  container_name: carmen-api-micro-report
  restart: unless-stopped
  ports:
    - "5015:5015"
    - "6015:6015"
  env_file:
    - ./apps/micro-report/.env
  environment:
    - NODE_ENV=production
    - REDIS_HOST=redis
  networks:
    - carmen-network
  depends_on:
    - api-backend-gateway
    - redis
  healthcheck:
    test: ["CMD", "bun", "-e", "fetch('http://localhost:6015/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s

redis:
  image: redis:7-alpine
  container_name: carmen-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  networks:
    - carmen-network
```
