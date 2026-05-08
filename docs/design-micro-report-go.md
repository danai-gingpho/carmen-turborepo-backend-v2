# micro-report Service Design (Go)

> **Status:** proposed — not yet implemented.
>
> This design document captures intent; no `apps/micro-report/` service exists in the repo as of 2026-04-20. Keep for reference when planning the service.

## Overview

micro-report เป็น Go microservice แยก repository/folder จาก NestJS monorepo
สื่อสารกับ backend-gateway ผ่าน **gRPC** (แทน NestJS TCP transport)
รองรับ output 4 formats: **PDF, Excel, CSV, JSON**

- **gRPC Port**: 5015 (inter-service RPC)
- **HTTP Port**: 6015 (health check + REST fallback)
- **Language**: Go 1.22+
- **Transport**: gRPC (Protocol Buffers)

## Why Go + gRPC?

```
  NestJS TCP Transport ไม่รองรับ Go โดยตรง
  ทางเลือกที่เหมาะสมที่สุดคือ gRPC เพราะ:

  +------------------+--------------------------------------------------+
  | Criteria         | gRPC                                             |
  +------------------+--------------------------------------------------+
  | NestJS support   | Built-in: @nestjs/microservices supports gRPC    |
  | Go support       | First-class: google.golang.org/grpc              |
  | Performance      | Binary protocol (protobuf), faster than JSON     |
  | Type safety      | .proto generates types for both Go & TypeScript  |
  | Streaming        | Supports server-stream (progress updates)        |
  | Ecosystem        | Standard for polyglot microservices               |
  +------------------+--------------------------------------------------+

  Gateway เดิมใช้ TCP -> เพิ่ม gRPC transport เฉพาะ report service
  Services อื่นยังคงใช้ TCP เหมือนเดิม ไม่ต้องแก้โค้ด
```

## Architecture Overview

```
                         backend-gateway (:4000)
                                |
               +----------------+----------------+
               |                                 |
          TCP (existing)                    gRPC (new)
          NestJS services                   micro-report
               |                                 |
               v                                 v
  +------------------------+     +------------------------------------+
  | micro-business :5020   |     |  micro-report (Go)                 |
  | micro-keycloak :5013   |     |                                    |
  | micro-file     :5007   |     |  +-------------+  +-------------+  |
  | micro-notif    :5006   |     |  | gRPC Server |  | HTTP Server |  |
  | micro-cronjob  :5012   |     |  | :5015       |  | :6015       |  |
  | micro-cluster  :5014   |     |  +------+------+  +------+------+  |
  +------------------------+     |         |                 |         |
                                 |         v                 v         |
                                 |  +------+------+  +------+------+  |
                                 |  | Report      |  | Health      |  |
                                 |  | Handler     |  | /health     |  |
                                 |  +------+------+  | /metrics    |  |
                                 |         |         +-------------+  |
                                 |         v                          |
                                 |  +------+------+                   |
                                 |  | Report      |                   |
                                 |  | Service     |                   |
                                 |  +--+--+--+--+-+                   |
                                 |     |  |  |  |                     |
                                 |     v  v  v  v                     |
                                 |  +-----------+  +---------------+  |
                                 |  | Builders  |  | Generators    |  |
                                 |  | (per type)|  | PDF/XLSX/CSV  |  |
                                 |  +-----------+  | /JSON         |  |
                                 |       |         +-------+-------+  |
                                 |       v                 |          |
                                 |  +----+----+            |          |
                                 |  |   DB    |            v          |
                                 |  | (pgx)  |     +------+------+   |
                                 |  +---------+     | Asynq       |   |
                                 |                  | (Redis Q)   |   |
                                 |                  +-------------+   |
                                 +------------------------------------+
                                          |          |          |
                                          v          v          v
                                    +--------+ +---------+ +--------+
                                    |  RDS   | |  Redis  | |  S3    |
                                    +--------+ +---------+ +--------+
```

## Project Structure (Separate Folder)

```
services/
  +-- micro-report/                         # แยก folder จาก NestJS monorepo
      |
      +-- cmd/
      |   +-- server/
      |       +-- main.go                   # Entry point: start gRPC + HTTP
      |
      +-- internal/
      |   +-- config/
      |   |   +-- config.go                 # Env config (envconfig/viper)
      |   |
      |   +-- server/
      |   |   +-- grpc.go                   # gRPC server setup
      |   |   +-- http.go                   # HTTP server (health + metrics)
      |   |
      |   +-- handler/
      |   |   +-- report_handler.go         # gRPC service implementation
      |   |   +-- schedule_handler.go       # Schedule RPC handlers
      |   |
      |   +-- service/
      |   |   +-- report_service.go         # Report orchestration logic
      |   |   +-- job_service.go            # Job status tracking
      |   |   +-- schedule_service.go       # Schedule CRUD
      |   |
      |   +-- builder/                      # Data aggregation layer
      |   |   +-- builder.go                # Builder interface
      |   |   +-- registry.go               # Builder registry (type -> builder)
      |   |   +-- inventory/
      |   |   |   +-- stock_on_hand.go
      |   |   |   +-- stock_movement.go
      |   |   |   +-- stock_valuation.go
      |   |   |   +-- stock_count_variance.go
      |   |   |   +-- transfer_report.go
      |   |   |   +-- slow_moving.go
      |   |   |   +-- reorder_alert.go
      |   |   |   +-- period_closing.go
      |   |   +-- procurement/
      |   |   |   +-- pr_summary.go
      |   |   |   +-- po_summary.go
      |   |   |   +-- po_by_vendor.go
      |   |   |   +-- po_by_department.go
      |   |   |   +-- grn_summary.go
      |   |   |   +-- grn_vs_po_variance.go
      |   |   |   +-- vendor_performance.go
      |   |   |   +-- credit_note_summary.go
      |   |   |   +-- outstanding_po.go
      |   |   |   +-- procurement_spend.go
      |   |   +-- recipe/
      |   |   |   +-- recipe_costing.go
      |   |   |   +-- recipe_card.go
      |   |   |   +-- food_cost_analysis.go
      |   |   |   +-- menu_costing.go
      |   |   |   +-- ingredient_usage.go
      |   |   |   +-- margin_analysis.go
      |   |   +-- vendor/
      |   |   |   +-- vendor_master.go
      |   |   |   +-- vendor_price_comparison.go
      |   |   |   +-- vendor_spend.go
      |   |   |   +-- vendor_contacts.go
      |   |   +-- financial/
      |   |       +-- cost_center.go
      |   |       +-- budget_vs_actual.go
      |   |       +-- journal_voucher.go
      |   |       +-- extra_cost.go
      |   |
      |   +-- generator/                    # Output format generators
      |   |   +-- generator.go              # Generator interface
      |   |   +-- pdf_generator.go          # go-wkhtmltopdf / gofpdf
      |   |   +-- excel_generator.go        # excelize
      |   |   +-- csv_generator.go          # encoding/csv
      |   |   +-- json_generator.go         # encoding/json (structured)
      |   |   +-- templates/                # HTML templates for PDF
      |   |       +-- inventory/
      |   |       |   +-- stock_on_hand.html
      |   |       |   +-- stock_movement.html
      |   |       +-- procurement/
      |   |       |   +-- po_summary.html
      |   |       |   +-- vendor_performance.html
      |   |       +-- recipe/
      |   |       |   +-- recipe_card.html
      |   |       |   +-- recipe_costing.html
      |   |       +-- common/
      |   |           +-- layout.html       # Base layout
      |   |           +-- header.html
      |   |           +-- footer.html
      |   |           +-- table.html
      |   |
      |   +-- queue/                        # Async job processing
      |   |   +-- producer.go               # Enqueue report jobs
      |   |   +-- consumer.go               # Process jobs (Asynq worker)
      |   |   +-- tasks.go                  # Task type definitions
      |   |
      |   +-- repository/                   # Database access layer
      |   |   +-- db.go                     # pgx connection pool
      |   |   +-- tenant.go                 # Multi-tenant DB resolver
      |   |   +-- report_job_repo.go        # tb_report_job CRUD
      |   |   +-- report_schedule_repo.go   # tb_report_schedule CRUD
      |   |   +-- report_template_repo.go   # tb_report_template CRUD
      |   |
      |   +-- model/                        # Domain models
      |   |   +-- report.go                 # ReportData, ReportColumn, etc.
      |   |   +-- job.go                    # ReportJob
      |   |   +-- schedule.go              # ReportSchedule
      |   |   +-- filter.go                # ReportFilters
      |   |
      |   +-- middleware/
      |       +-- logging.go               # gRPC interceptor: structured logging
      |       +-- recovery.go              # gRPC interceptor: panic recovery
      |       +-- tenant.go                # gRPC interceptor: extract tenant context
      |
      +-- proto/                            # Protocol Buffer definitions
      |   +-- report/
      |       +-- v1/
      |           +-- report.proto          # Service + Message definitions
      |           +-- report_grpc.pb.go     # Generated gRPC code
      |           +-- report.pb.go          # Generated protobuf code
      |
      +-- migrations/                       # SQL migrations (golang-migrate)
      |   +-- 001_create_report_tables.up.sql
      |   +-- 001_create_report_tables.down.sql
      |
      +-- Dockerfile
      +-- Makefile                          # Build, test, proto-gen, migrate
      +-- go.mod
      +-- go.sum
      +-- .env.example
      +-- README.md
```

## Protocol Buffer Definition

```protobuf
// proto/report/v1/report.proto

syntax = "proto3";

package report.v1;

option go_package = "github.com/CarmenSoftware/micro-report/proto/report/v1;reportv1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/struct.proto";

// ============================================================
// Service Definition
// ============================================================

service ReportService {
  // Sync: generate and return file bytes
  rpc Generate(GenerateRequest) returns (GenerateResponse);

  // Async: queue job, return job ID
  rpc GenerateAsync(GenerateRequest) returns (AsyncResponse);

  // Async: stream progress updates
  rpc GenerateWithProgress(GenerateRequest) returns (stream ProgressUpdate);

  // Job management
  rpc GetJobStatus(JobStatusRequest) returns (JobStatusResponse);
  rpc CancelJob(CancelJobRequest) returns (CancelJobResponse);
  rpc GetDownloadURL(DownloadRequest) returns (DownloadResponse);

  // Report catalog
  rpc ListReportTypes(ListTypesRequest) returns (ListTypesResponse);
  rpc GetReportHistory(HistoryRequest) returns (HistoryResponse);

  // Schedules
  rpc CreateSchedule(CreateScheduleRequest) returns (ScheduleResponse);
  rpc ListSchedules(ListSchedulesRequest) returns (ListSchedulesResponse);
  rpc DeleteSchedule(DeleteScheduleRequest) returns (DeleteScheduleResponse);

  // Templates
  rpc ListTemplates(ListTemplatesRequest) returns (ListTemplatesResponse);
  rpc CreateTemplate(CreateTemplateRequest) returns (TemplateResponse);
}

// ============================================================
// Enums
// ============================================================

enum ReportFormat {
  REPORT_FORMAT_UNSPECIFIED = 0;
  REPORT_FORMAT_PDF         = 1;
  REPORT_FORMAT_EXCEL       = 2;
  REPORT_FORMAT_CSV         = 3;
  REPORT_FORMAT_JSON        = 4;
}

enum ReportCategory {
  REPORT_CATEGORY_UNSPECIFIED  = 0;
  REPORT_CATEGORY_INVENTORY    = 1;
  REPORT_CATEGORY_PROCUREMENT  = 2;
  REPORT_CATEGORY_RECIPE       = 3;
  REPORT_CATEGORY_VENDOR       = 4;
  REPORT_CATEGORY_FINANCIAL    = 5;
  REPORT_CATEGORY_OPERATIONAL  = 6;
}

enum JobStatus {
  JOB_STATUS_UNSPECIFIED = 0;
  JOB_STATUS_QUEUED      = 1;
  JOB_STATUS_PROCESSING  = 2;
  JOB_STATUS_COMPLETED   = 3;
  JOB_STATUS_FAILED      = 4;
  JOB_STATUS_CANCELLED   = 5;
}

// ============================================================
// Common Messages
// ============================================================

message TenantContext {
  string user_id    = 1;
  string bu_code    = 2;
  string cluster_id = 3;
  string request_id = 4;
  string ip_address = 5;
  string user_agent = 6;
}

message ReportFilters {
  optional string              date_from       = 1;
  optional string              date_to         = 2;
  repeated string              location_ids    = 3;
  repeated string              department_ids  = 4;
  repeated string              vendor_ids      = 5;
  repeated string              product_ids     = 6;
  repeated string              category_ids    = 7;
  repeated string              status          = 8;
  optional string              period_id       = 9;
  optional string              currency_id     = 10;
}

message ReportOptions {
  optional string title       = 1;
  string locale               = 2;  // default: "th-TH"
  string timezone             = 3;  // default: "Asia/Bangkok"
  string page_size            = 4;  // A4, A3, letter
  string orientation          = 5;  // portrait, landscape
  bool   include_summary      = 6;
  optional string group_by    = 7;
  optional string sort_by     = 8;
  string sort_order           = 9;  // asc, desc
}

// ============================================================
// Generate
// ============================================================

message GenerateRequest {
  TenantContext  context      = 1;
  string         report_type  = 2;  // e.g., "stock-on-hand"
  ReportFormat   format       = 3;
  ReportFilters  filters      = 4;
  ReportOptions  options      = 5;
}

message GenerateResponse {
  bytes  file_content  = 1;
  string file_name     = 2;  // e.g., "stock-on-hand-2026-03-05.pdf"
  string content_type  = 3;  // e.g., "application/pdf"
  int64  file_size     = 4;
  int32  row_count     = 5;
}

message AsyncResponse {
  string job_id  = 1;
  string message = 2;
}

message ProgressUpdate {
  string  job_id     = 1;
  int32   progress   = 2;  // 0-100
  string  stage      = 3;  // "querying", "building", "generating", "uploading"
  string  message    = 4;
}

// ============================================================
// Job Management
// ============================================================

message JobStatusRequest {
  TenantContext context = 1;
  string        job_id  = 2;
}

message JobStatusResponse {
  string                       job_id        = 1;
  string                       report_type   = 2;
  ReportFormat                 format        = 3;
  JobStatus                    status        = 4;
  optional string              file_url      = 5;
  optional int64               file_size     = 6;
  optional int32               row_count     = 7;
  optional string              error_message = 8;
  optional google.protobuf.Timestamp started_at    = 9;
  optional google.protobuf.Timestamp completed_at  = 10;
  optional int32               duration_ms   = 11;
}

message CancelJobRequest {
  TenantContext context = 1;
  string        job_id  = 2;
}

message CancelJobResponse {
  bool   success = 1;
  string message = 2;
}

message DownloadRequest {
  TenantContext context = 1;
  string        job_id  = 2;
}

message DownloadResponse {
  string download_url = 1;  // S3 pre-signed URL
  string file_name    = 2;
  string content_type = 3;
  int64  file_size    = 4;
  google.protobuf.Timestamp expires_at = 5;
}

// ============================================================
// Catalog & History
// ============================================================

message ListTypesRequest {
  TenantContext    context  = 1;
  optional string  category = 2;  // filter by category
}

message ReportTypeInfo {
  string          report_type = 1;
  string          name        = 2;
  string          description = 3;
  ReportCategory  category    = 4;
  repeated ReportFormat supported_formats = 5;
}

message ListTypesResponse {
  repeated ReportTypeInfo types = 1;
}

message HistoryRequest {
  TenantContext   context   = 1;
  optional int32  page      = 2;
  optional int32  per_page  = 3;
  optional string report_type = 4;
}

message HistoryResponse {
  repeated JobStatusResponse jobs  = 1;
  int32  total                     = 2;
  int32  page                      = 3;
  int32  per_page                  = 4;
}

// ============================================================
// Schedule
// ============================================================

message CreateScheduleRequest {
  TenantContext  context         = 1;
  string         name            = 2;
  string         report_type     = 3;
  ReportFormat   format          = 4;
  string         cron_expression = 5;  // "0 8 * * 1"
  ReportFilters  filters         = 6;
  ReportOptions  options         = 7;
  repeated string recipients     = 8;  // email list
}

message ScheduleResponse {
  string id                               = 1;
  string name                             = 2;
  string report_type                      = 3;
  ReportFormat format                     = 4;
  string cron_expression                  = 5;
  bool   is_active                        = 6;
  optional google.protobuf.Timestamp last_run_at = 7;
  optional google.protobuf.Timestamp next_run_at = 8;
}

message ListSchedulesRequest {
  TenantContext context = 1;
}

message ListSchedulesResponse {
  repeated ScheduleResponse schedules = 1;
}

message DeleteScheduleRequest {
  TenantContext context = 1;
  string        id      = 2;
}

message DeleteScheduleResponse {
  bool   success = 1;
  string message = 2;
}

// ============================================================
// Template
// ============================================================

message CreateTemplateRequest {
  TenantContext  context     = 1;
  string         name        = 2;
  string         report_type = 3;
  string         description = 4;
  ReportFilters  filters     = 5;
  ReportOptions  options     = 6;
  bool           is_default  = 7;
}

message TemplateResponse {
  string         id          = 1;
  string         name        = 2;
  string         report_type = 3;
  string         description = 4;
  ReportFilters  filters     = 5;
  ReportOptions  options     = 6;
  bool           is_default  = 7;
  bool           is_active   = 8;
}

message ListTemplatesRequest {
  TenantContext  context     = 1;
  optional string report_type = 2;
}

message ListTemplatesResponse {
  repeated TemplateResponse templates = 1;
}
```

## Core Go Interfaces

```go
// ============================================================
// internal/model/report.go
// ============================================================

package model

import "time"

type ReportFormat string

const (
	FormatPDF   ReportFormat = "pdf"
	FormatExcel ReportFormat = "excel"
	FormatCSV   ReportFormat = "csv"
	FormatJSON  ReportFormat = "json"
)

type ReportCategory string

const (
	CategoryInventory   ReportCategory = "inventory"
	CategoryProcurement ReportCategory = "procurement"
	CategoryRecipe      ReportCategory = "recipe"
	CategoryVendor      ReportCategory = "vendor"
	CategoryFinancial   ReportCategory = "financial"
	CategoryOperational ReportCategory = "operational"
)

type JobStatus string

const (
	StatusQueued     JobStatus = "queued"
	StatusProcessing JobStatus = "processing"
	StatusCompleted  JobStatus = "completed"
	StatusFailed     JobStatus = "failed"
	StatusCancelled  JobStatus = "cancelled"
)

type ReportFilters struct {
	DateFrom      *string  `json:"date_from,omitempty"`
	DateTo        *string  `json:"date_to,omitempty"`
	LocationIDs   []string `json:"location_ids,omitempty"`
	DepartmentIDs []string `json:"department_ids,omitempty"`
	VendorIDs     []string `json:"vendor_ids,omitempty"`
	ProductIDs    []string `json:"product_ids,omitempty"`
	CategoryIDs   []string `json:"category_ids,omitempty"`
	Status        []string `json:"status,omitempty"`
	PeriodID      *string  `json:"period_id,omitempty"`
	CurrencyID    *string  `json:"currency_id,omitempty"`
}

type ReportOptions struct {
	Title          *string `json:"title,omitempty"`
	Locale         string  `json:"locale"`          // "th-TH"
	Timezone       string  `json:"timezone"`        // "Asia/Bangkok"
	PageSize       string  `json:"page_size"`       // "A4"
	Orientation    string  `json:"orientation"`     // "portrait"
	IncludeSummary bool    `json:"include_summary"`
	GroupBy        *string `json:"group_by,omitempty"`
	SortBy         *string `json:"sort_by,omitempty"`
	SortOrder      string  `json:"sort_order"`      // "asc"
}

type ReportColumn struct {
	Key    string `json:"key"`
	Label  string `json:"label"`
	Type   string `json:"type"`    // string, number, decimal, date, boolean
	Width  int    `json:"width,omitempty"`
	Align  string `json:"align,omitempty"`  // left, center, right
	Format string `json:"format,omitempty"` // "#,##0.00"
}

type ReportData struct {
	Title          string            `json:"title"`
	Subtitle       string            `json:"subtitle,omitempty"`
	GeneratedAt    time.Time         `json:"generated_at"`
	FiltersApplied map[string]string `json:"filters_applied"`
	Summary        map[string]any    `json:"summary,omitempty"`
	Columns        []ReportColumn    `json:"columns"`
	Rows           []map[string]any  `json:"rows"`
	Totals         map[string]any    `json:"totals,omitempty"`
}

type ReportResult struct {
	FileContent []byte
	FileName    string
	ContentType string
	FileSize    int64
	RowCount    int
}

// ============================================================
// internal/builder/builder.go
// ============================================================

package builder

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
	"micro-report/internal/model"
)

// Builder aggregates data from DB for a specific report type.
type Builder interface {
	Build(ctx context.Context, db *pgxpool.Pool, filters model.ReportFilters) (*model.ReportData, error)
}

// ============================================================
// internal/generator/generator.go
// ============================================================

package generator

import "micro-report/internal/model"

// Generator renders ReportData into a specific output format.
type Generator interface {
	Generate(data *model.ReportData, opts model.ReportOptions) (*model.ReportResult, error)
	ContentType() string
	FileExtension() string
}
```

## JSON Output Format

```go
// ============================================================
// internal/generator/json_generator.go
// ============================================================

package generator

import (
	"encoding/json"
	"fmt"
	"micro-report/internal/model"
	"time"
)

type JSONGenerator struct{}

// JSON output structure
type JSONReport struct {
	Meta    JSONReportMeta     `json:"meta"`
	Summary map[string]any     `json:"summary,omitempty"`
	Columns []model.ReportColumn `json:"columns"`
	Data    []map[string]any   `json:"data"`
	Totals  map[string]any     `json:"totals,omitempty"`
}

type JSONReportMeta struct {
	Title          string            `json:"title"`
	Subtitle       string            `json:"subtitle,omitempty"`
	GeneratedAt    time.Time         `json:"generated_at"`
	Format         string            `json:"format"`
	RowCount       int               `json:"row_count"`
	FiltersApplied map[string]string `json:"filters_applied"`
}

func (g *JSONGenerator) Generate(
	data *model.ReportData,
	opts model.ReportOptions,
) (*model.ReportResult, error) {

	report := JSONReport{
		Meta: JSONReportMeta{
			Title:          data.Title,
			Subtitle:       data.Subtitle,
			GeneratedAt:    data.GeneratedAt,
			Format:         "json",
			RowCount:       len(data.Rows),
			FiltersApplied: data.FiltersApplied,
		},
		Summary: data.Summary,
		Columns: data.Columns,
		Data:    data.Rows,
		Totals:  data.Totals,
	}

	bytes, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("json marshal: %w", err)
	}

	return &model.ReportResult{
		FileContent: bytes,
		FileName:    fmt.Sprintf("%s.json", data.Title),
		ContentType: "application/json",
		FileSize:    int64(len(bytes)),
		RowCount:    len(data.Rows),
	}, nil
}

func (g *JSONGenerator) ContentType() string   { return "application/json" }
func (g *JSONGenerator) FileExtension() string { return ".json" }
```

```json
// Example JSON output: Stock On-Hand
{
  "meta": {
    "title": "Stock On-Hand Summary",
    "generated_at": "2026-03-05T10:30:00+07:00",
    "format": "json",
    "row_count": 150,
    "filters_applied": {
      "from": "2026-01-01",
      "to": "2026-03-05",
      "locations": "LOC-001, LOC-002"
    }
  },
  "summary": {
    "total_products": 85,
    "total_locations": 3,
    "total_qty": 12500.50,
    "total_value": 3456789.25
  },
  "columns": [
    { "key": "product_code", "label": "Product Code", "type": "string" },
    { "key": "product_name", "label": "Product Name", "type": "string" },
    { "key": "location_name", "label": "Location", "type": "string" },
    { "key": "qty_on_hand", "label": "Qty On Hand", "type": "decimal", "format": "#,##0.00" },
    { "key": "total_cost", "label": "Total Cost", "type": "decimal", "format": "#,##0.00" }
  ],
  "data": [
    {
      "product_code": "PRD-001",
      "product_name": "Chicken Breast",
      "location_name": "Main Kitchen",
      "qty_on_hand": 150.00,
      "total_cost": 22500.00
    },
    {
      "product_code": "PRD-002",
      "product_name": "Olive Oil 1L",
      "location_name": "Dry Store",
      "qty_on_hand": 45.00,
      "total_cost": 13500.00
    }
  ],
  "totals": {
    "qty_on_hand": 12500.50,
    "total_cost": 3456789.25
  }
}
```

## Go Dependencies (go.mod)

```go
module github.com/CarmenSoftware/micro-report

go 1.22

require (
    // gRPC
    google.golang.org/grpc v1.64.0
    google.golang.org/protobuf v1.34.0

    // Database
    github.com/jackc/pgx/v5 v5.6.0        // PostgreSQL driver (pgxpool)

    // Redis / Queue
    github.com/hibiken/asynq v0.24.0       // Task queue (Redis-backed, like BullMQ)
    github.com/redis/go-redis/v9 v9.5.0

    // Report Generation
    github.com/xuri/excelize/v2 v2.8.0     // Excel (.xlsx)
    github.com/SebastiaanKlipworthy/go-wkhtmltopdf v1.9.0  // PDF (via wkhtmltopdf)
    // Alternative: github.com/go-pdf/fpdf v0.9.0            // Pure Go PDF
    // Alternative: github.com/chromedp/chromedp              // Headless Chrome PDF

    // Config
    github.com/kelseyhightower/envconfig v1.4.0
    github.com/joho/godotenv v1.5.0

    // Logging
    go.uber.org/zap v1.27.0                // Structured logging

    // Observability
    github.com/prometheus/client_golang v1.19.0  // Metrics
    go.opentelemetry.io/otel v1.27.0             // Tracing

    // AWS
    github.com/aws/aws-sdk-go-v2 v1.27.0
    github.com/aws/aws-sdk-go-v2/service/s3 v1.55.0

    // UUID
    github.com/google/uuid v1.6.0

    // Migration
    github.com/golang-migrate/migrate/v4 v4.17.0
)
```

## Gateway Integration (NestJS gRPC Client)

```
เปลี่ยนเฉพาะ report module ใน gateway ให้ใช้ gRPC แทน TCP

apps/backend-gateway/src/application/report/
  +-- report.module.ts          # gRPC ClientsModule
  +-- report.controller.ts      # HTTP -> gRPC proxy
  +-- report.service.ts         # gRPC client calls
  +-- proto/
      +-- report.proto          # Copy from services/micro-report/proto/
```

```typescript
// apps/backend-gateway/src/application/report/report.module.ts

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { envConfig } from '@/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REPORT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'report.v1',
          protoPath: join(__dirname, 'proto/report.proto'),
          url: `${envConfig.REPORT_SERVICE_HOST}:${envConfig.REPORT_SERVICE_PORT}`,
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
```

```typescript
// apps/backend-gateway/src/application/report/report.service.ts

import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface ReportServiceGrpc {
  Generate(request: any): Observable<any>;
  GenerateAsync(request: any): Observable<any>;
  GetJobStatus(request: any): Observable<any>;
  GetDownloadURL(request: any): Observable<any>;
  CancelJob(request: any): Observable<any>;
  ListReportTypes(request: any): Observable<any>;
  GetReportHistory(request: any): Observable<any>;
  CreateSchedule(request: any): Observable<any>;
  ListSchedules(request: any): Observable<any>;
  DeleteSchedule(request: any): Observable<any>;
}

@Injectable()
export class ReportService implements OnModuleInit {
  private reportService: ReportServiceGrpc;

  constructor(
    @Inject('REPORT_SERVICE')
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.reportService = this.client.getService<ReportServiceGrpc>('ReportService');
  }

  async generate(
    reportType: string,
    format: string,
    filters: any,
    options: any,
    userId: string,
    buCode: string,
  ) {
    const response = await firstValueFrom(
      this.reportService.Generate({
        context: { user_id: userId, bu_code: buCode },
        report_type: reportType,
        format: this.mapFormat(format),
        filters,
        options,
      }),
    );

    return Result.ok({
      file_content: Buffer.from(response.file_content),
      file_name: response.file_name,
      content_type: response.content_type,
      file_size: response.file_size,
      row_count: response.row_count,
    });
  }

  async generateAsync(
    reportType: string,
    format: string,
    filters: any,
    options: any,
    userId: string,
    buCode: string,
  ) {
    const response = await firstValueFrom(
      this.reportService.GenerateAsync({
        context: { user_id: userId, bu_code: buCode },
        report_type: reportType,
        format: this.mapFormat(format),
        filters,
        options,
      }),
    );

    return Result.ok({
      job_id: response.job_id,
      message: response.message,
    });
  }

  private mapFormat(format: string): number {
    const map: Record<string, number> = {
      pdf: 1,
      excel: 2,
      csv: 3,
      json: 4,
    };
    return map[format] ?? 0;
  }
}
```

## Dockerfile (Go Multi-stage)

```dockerfile
# ---- Build ----
FROM golang:1.22-bookworm AS builder

WORKDIR /app

# Install wkhtmltopdf for PDF generation
RUN apt-get update && apt-get install -y \
    wkhtmltopdf \
    fonts-thai-tlwg \
    && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/micro-report ./cmd/server

# ---- Runtime ----
FROM debian:bookworm-slim AS runner

RUN apt-get update && apt-get install -y \
    ca-certificates \
    wkhtmltopdf \
    fonts-thai-tlwg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /bin/micro-report /bin/micro-report
COPY --from=builder /app/internal/generator/templates /app/templates

ENV TEMPLATE_DIR=/app/templates

EXPOSE 5015
EXPOSE 6015

ENTRYPOINT ["/bin/micro-report"]
```

## Makefile

```makefile
.PHONY: proto build run test lint migrate docker

# Generate protobuf code
proto:
	protoc --go_out=. --go_opt=paths=source_relative \
	       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
	       proto/report/v1/report.proto
	# Also generate TypeScript for gateway
	npx grpc_tools_node_protoc \
	       --ts_out=../apps/backend-gateway/src/application/report/proto \
	       --grpc_out=../apps/backend-gateway/src/application/report/proto \
	       proto/report/v1/report.proto

# Build binary
build:
	CGO_ENABLED=0 go build -o bin/micro-report ./cmd/server

# Run locally
run:
	go run ./cmd/server

# Run tests
test:
	go test ./... -v -cover

# Lint
lint:
	golangci-lint run ./...

# Database migrations
migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down

# Docker
docker-build:
	docker build -t carmen-micro-report:latest .

docker-run:
	docker run -p 5015:5015 -p 6015:6015 --env-file .env carmen-micro-report:latest
```

## Environment Configuration

```bash
# .env.example

# Server
GRPC_PORT=5015
HTTP_PORT=6015

# Database (Platform - for tenant resolution)
PLATFORM_DATABASE_URL=postgresql://user:pass@host:5432/platform?sslmode=require

# Redis (for Asynq queue)
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# AWS S3
AWS_REGION=ap-southeast-7
AWS_S3_BUCKET=carmen-reports
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Report settings
REPORT_SYNC_MAX_ROWS=10000
REPORT_ASYNC_TTL_HOURS=24
TEMPLATE_DIR=./internal/generator/templates

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Thai font path (for PDF)
FONT_DIR=/usr/share/fonts/truetype/thai
```

## Docker Compose Update

```yaml
# เพิ่มใน docker-compose.yml / docker-compose.dev.yml

api-micro-report:
  build:
    context: ./services/micro-report
    dockerfile: Dockerfile
  image: ${ECR_REGISTRY}/${IMAGE_PREFIX}-micro-report:${IMAGE_TAG:-latest}
  container_name: carmen-api-micro-report
  restart: unless-stopped
  ports:
    - "5015:5015"
    - "6015:6015"
  environment:
    - GRPC_PORT=5015
    - HTTP_PORT=6015
    - PLATFORM_DATABASE_URL=${SYSTEM_DATABASE_URL}
    - REDIS_ADDR=redis:6379
    - AWS_REGION=ap-southeast-7
    - AWS_S3_BUCKET=carmen-reports
    - LOG_LEVEL=info
  networks:
    - carmen-network
  depends_on:
    - redis
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:6015/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 20s

redis:
  image: redis:7-alpine
  container_name: carmen-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - carmen-network

volumes:
  redis_data:
```

## Comparison: Go vs NestJS for Report Service

```
+---------------------------+------------------+------------------+
| Aspect                    | Go               | NestJS           |
+---------------------------+------------------+------------------+
| Startup time              | ~50ms            | ~2-5s            |
| Memory usage (idle)       | ~15MB            | ~150MB           |
| Memory usage (PDF gen)    | ~50-100MB        | ~300-500MB       |
| Concurrent report gen     | Goroutines       | Event loop       |
|                           | (true parallel)  | (single thread)  |
| CPU-heavy tasks (PDF)     | Excellent        | Needs worker     |
| Binary size               | ~30MB            | ~200MB (node_modules) |
| Docker image size         | ~100MB           | ~500MB           |
| Cold start (K8s)          | ~1s              | ~10s             |
| Gateway integration       | gRPC (new)       | TCP (existing)   |
| Prisma support            | No (use pgx)     | Yes (native)     |
| Thai font support (PDF)   | wkhtmltopdf      | Puppeteer        |
+---------------------------+------------------+------------------+

Go ดีกว่าสำหรับ report service เพราะ:
- Report generation เป็น CPU-intensive -> Go parallel ดีกว่า
- Memory efficient -> scale-to-zero/up ใน K8s เร็วกว่า
- Cold start เร็ว -> dynamic clustering ทำงานดีกว่า
- Binary deploy -> Docker image เล็กกว่า 5x
```

## Migration Path

```
Phase 1: Setup (Week 1)
========================
[ ] Init Go project ใน services/micro-report/
[ ] Define .proto file
[ ] Generate gRPC code (Go + TypeScript)
[ ] Setup pgx connection pool + tenant resolver
[ ] Implement health check HTTP server

Phase 2: Core (Week 2)
========================
[ ] Implement report service + handler
[ ] Build 3 builders: stock-on-hand, po-summary, recipe-costing
[ ] Implement 4 generators: PDF, Excel, CSV, JSON
[ ] Write unit tests

Phase 3: Gateway (Week 3)
==========================
[ ] Add gRPC client module to backend-gateway
[ ] Create report controller + service in gateway
[ ] Add REPORT_SERVICE env to gateway
[ ] Test end-to-end: client -> gateway -> micro-report -> DB

Phase 4: Async + Queue (Week 4)
================================
[ ] Setup Asynq (Redis queue)
[ ] Implement async report generation
[ ] Job status tracking (tb_report_job)
[ ] S3 upload for completed reports
[ ] Notification integration

Phase 5: Full Catalog (Week 5-6)
==================================
[ ] Implement remaining 30+ builders
[ ] Schedule CRUD + cron trigger
[ ] Template management
[ ] Thai font + localization for PDF
[ ] E2E testing + load testing
```
