CREATE TYPE "enum_activity_action" AS ENUM (
  'view',
  'create',
  'update',
  'delete',
  'login',
  'other'
);

CREATE TYPE "enum_activity_entity_type" AS ENUM (
  'user',
  'business_unit',
  'product',
  'location',
  'department',
  'unit',
  'currency',
  'exchange_rate',
  'menu',
  'delivery_point',
  'purchase_request',
  'purchase_request_item',
  'purchase_order',
  'purchase_order_item',
  'good_received_note',
  'good_received_note_item',
  'inventory_transaction',
  'inventory_adjustment',
  'store_requisition',
  'store_requisition_item',
  'stock_in',
  'stock_out',
  'stock_adjustment',
  'stock_transfer',
  'stock_count',
  'stock_take',
  'stock_take_item',
  'other'
);

CREATE TYPE "enum_location_type" AS ENUM (
  'inventory',
  'direct',
  'consignment'
);

CREATE TYPE "enum_location_status_type" AS ENUM (
  'active',
  'inactive',
  'maintenance'
);

CREATE TYPE "enum_unit_type" AS ENUM (
  'order_unit',
  'ingredient_unit'
);

CREATE TYPE "enum_product_status_type" AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE "enum_tax_type" AS ENUM (
  'none',
  'included',
  'add'
);

CREATE TYPE "enum_workflow_type" AS ENUM (
  'purchase_request',
  'purchase_order',
  'store_requisition'
);

CREATE TYPE "enum_purchase_request_doc_status" AS ENUM (
  'draft',
  'work_in_process',
  'complete',
  'complete_purchase_order'
);

CREATE TYPE "enum_purchase_request_workflow_status" AS ENUM (
  'draft',
  'pending',
  'review',
  'accept',
  'reject'
);

CREATE TYPE "enum_purchase_order_doc_status" AS ENUM (
  'open',
  'voided',
  'closed',
  'draft',
  'sent',
  'partial',
  'fully_received',
  'cancelled',
  'deleted'
);

CREATE TYPE "enum_vendor_contact_type" AS ENUM (
  'phone',
  'email'
);

CREATE TYPE "enum_vendor_address_type" AS ENUM (
  'contact_address',
  'mailing_address',
  'register_address'
);

CREATE TYPE "enum_inventory_doc_type" AS ENUM (
  'good_received_note',
  'credit_note',
  'store_requisition',
  'stock_in',
  'stock_out',
  'stock_take'
);

CREATE TYPE "enum_doc_status" AS ENUM (
  'draft',
  'complete',
  'void'
);

CREATE TYPE "enum_good_received_note_status" AS ENUM (
  'draft',
  'complete',
  'void'
);

CREATE TYPE "enum_good_received_note_type" AS ENUM (
  'manual',
  'purchase_order'
);

CREATE TYPE "enum_allocate_extracost_type" AS ENUM (
  'manual',
  'by_value',
  'by_qty'
);

CREATE TYPE "enum_count_stock_type" AS ENUM (
  'physical',
  'spot'
);

CREATE TYPE "enum_count_stock_status" AS ENUM (
  'draft',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE "enum_jv_status" AS ENUM (
  'draft',
  'posted'
);

CREATE TYPE "enum_comment_type" AS ENUM (
  'user',
  'system'
);

CREATE TYPE "enum_dimension_type" AS ENUM (
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'dataset',
  'lookup',
  'lookup_dataset'
);

CREATE TYPE "enum_dimension_display_in" AS ENUM (
  'currency',
  'exchange_rate',
  'delivery_point',
  'department',
  'product_category',
  'product_sub_category',
  'product_item_group',
  'product',
  'location',
  'vendor',
  'price_list',
  'unit',
  'purchase_request_header',
  'purchase_request_detail',
  'purchase_order_header',
  'purchase_order_detail',
  'goods_received_note_header',
  'goods_received_note_detail',
  'stock_take',
  'stock_take_detail',
  'transfer_header',
  'transfer_detail',
  'stock_in_header',
  'stock_in_detail',
  'stock_out_header',
  'stock_out_detail'
);

CREATE TABLE "tb_activity" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "action" enum_activity_action,
  "entity_type" enum_activity_entity_type,
  "entity_id" uuid,
  "actor_id" uuid,
  "meta_data" json,
  "old_data" json,
  "new_data" json,
  "ip_address" text,
  "user_agent" text,
  "description" text,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid
);

CREATE TABLE "tb_menu" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "module_id" uuid NOT NULL,
  "name" varchar NOT NULL,
  "url" varchar NOT NULL,
  "description" text,
  "is_visible" bool DEFAULT true,
  "is_active" bool DEFAULT true,
  "is_lock" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_currency" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "code" varchar(3) UNIQUE NOT NULL,
  "name" varchar(100) NOT NULL,
  "symbol" varchar(5),
  "description" text DEFAULT '',
  "decimal_places" integer DEFAULT 2,
  "is_active" bool DEFAULT true,
  "exchange_rate" numeric(15,5) DEFAULT 1,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_exchange_rate" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "at_date" timestamptz DEFAULT (now()),
  "currency_id" uuid,
  "exchange_rate" numeric(15,5) DEFAULT 1,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_location" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "location_type" enum_location_type NOT NULL,
  "description" text,
  "info" json,
  "is_active" bool DEFAULT true,
  "delivery_point_id" uuid,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_delivery_point" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_unit" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_unit_conversion" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "product_id" uuid,
  "unit_type" enum_unit_type NOT NULL,
  "from_unit_id" uuid,
  "from_unit_name" varchar NOT NULL,
  "from_unit_qty" numeric(20,5) DEFAULT 1,
  "to_unit_id" uuid,
  "to_unit_name" varchar NOT NULL,
  "to_unit_qty" numeric(20,5) DEFAULT 1,
  "is_default" bool DEFAULT false,
  "description" json,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_department" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_department_user" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "department_id" uuid NOT NULL,
  "is_hod" bool DEFAULT false,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_user_location" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "code" varchar UNIQUE NOT NULL,
  "name" varchar UNIQUE NOT NULL,
  "local_name" varchar,
  "description" text,
  "inventory_unit_id" uuid NOT NULL,
  "inventory_unit_name" varchar NOT NULL DEFAULT '',
  "product_status_type" enum_product_status_type NOT NULL DEFAULT 'active',
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_info" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "product_id" uuid UNIQUE NOT NULL,
  "product_item_group_id" uuid,
  "is_used_in_recipe" bool DEFAULT true,
  "is_sold_directly" bool DEFAULT false,
  "barcode" varchar,
  "price_deviation_limit" numeric(20,5) DEFAULT 0,
  "qty_deviation_limit" numeric(20,5) DEFAULT 0,
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_tax_type_inventory" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5) DEFAULT 0,
  "decimal_places" integer DEFAULT 2,
  "account_code" varchar,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_location" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "product_id" uuid NOT NULL,
  "location_id" uuid NOT NULL,
  "min_qty" numeric(20,5) DEFAULT 0,
  "max_qty" numeric(20,5) DEFAULT 0,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_category" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "code" varchar UNIQUE NOT NULL,
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "price_deviation_limit" numeric(20,5) DEFAULT 0,
  "qty_deviation_limit" numeric(20,5) DEFAULT 0,
  "is_used_in_recipe" bool DEFAULT true,
  "is_sold_directly" bool DEFAULT false,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_sub_category" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "code" varchar NOT NULL DEFAULT '',
  "name" varchar NOT NULL,
  "description" text,
  "price_deviation_limit" numeric(20,5) DEFAULT 0,
  "qty_deviation_limit" numeric(20,5) DEFAULT 0,
  "is_used_in_recipe" bool DEFAULT true,
  "is_sold_directly" bool DEFAULT false,
  "is_active" bool DEFAULT true,
  "product_category_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_item_group" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "code" varchar NOT NULL DEFAULT '',
  "name" varchar NOT NULL,
  "description" text,
  "price_deviation_limit" numeric(20,5) DEFAULT 0,
  "qty_deviation_limit" numeric(20,5) DEFAULT 0,
  "is_used_in_recipe" bool DEFAULT true,
  "is_sold_directly" bool DEFAULT false,
  "is_active" bool DEFAULT true,
  "product_subcategory_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_workflow" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "workflow_type" enum_workflow_type NOT NULL,
  "description" text,
  "data" json,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_purchase_request" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "reference_name" varchar UNIQUE NOT NULL,
  "purchase_request_date" timestamptz,
  "workflow_id" uuid,
  "workflow_obj" json,
  "workflow_history" json,
  "current_workflow_status" varchar,
  "purchase_request_status" enum_purchase_request_doc_status DEFAULT 'draft',
  "requestor_id" uuid,
  "requestor_name" varchar,
  "department_id" uuid,
  "department_name" varchar,
  "job_code" varchar,
  "budget_code" varchar,
  "allocated_budget_amount" numeric(20,5),
  "is_active" bool DEFAULT true,
  "doc_version" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_purchase_request_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "purchase_request_id" uuid,
  "location_id" uuid,
  "location_name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "vendor_id" uuid,
  "vendor_name" varchar,
  "price_list_id" uuid,
  "description" text,
  "requested_qty" numeric(20,5),
  "requested_unit_id" uuid,
  "requested_unit_name" varchar,
  "approved_qty" numeric(20,5),
  "approved_unit_id" uuid,
  "approved_unit_name" varchar,
  "currency_id" uuid,
  "exchange_rate" numeric(15,5),
  "exchange_rate_date" timestamptz,
  "price" numeric(20,5),
  "total_price" numeric(20,5),
  "foc" numeric(20,5),
  "foc_unit_id" uuid,
  "foc_unit_name" varchar,
  "tax_type_inventory_id" uuid,
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5),
  "tax_amount" numeric(20,5),
  "is_tax_adjustment" bool DEFAULT false,
  "is_discount" bool DEFAULT false,
  "discount_rate" numeric(15,5) DEFAULT 0,
  "discount_amount" numeric(20,5) DEFAULT 0,
  "is_discount_adjustment" bool DEFAULT false,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_credit_term" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "value" numeric(15,5),
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_purchase_order" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "purchase_order_status" enum_purchase_order_doc_status DEFAULT 'open',
  "description" text,
  "order_date" timestamptz,
  "delivery_date" timestamptz,
  "vendor_id" uuid,
  "vendor_name" varchar,
  "currency_id" uuid,
  "currency_name" varchar,
  "base_currency_id" uuid,
  "base_currency_name" varchar,
  "exchange_rate" numeric(15,5),
  "notes" text,
  "approval_date" timestamptz,
  "email" varchar,
  "buyer_id" uuid,
  "buyer_name" varchar,
  "credit_term_id" uuid,
  "credit_term_name" varchar,
  "credit_term_value" numeric(15,5),
  "remarks" text,
  "info" json,
  "history" json,
  "is_active" bool DEFAULT true,
  "doc_version" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_purchase_order_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "purchase_order_id" uuid,
  "purchase_request_detail_id" uuid,
  "exchange_rate" numeric(15,5),
  "order_qty" numeric(20,5),
  "order_unit_id" uuid,
  "order_unit_name" varchar,
  "base_qty" numeric(20,5),
  "base_unit_id" uuid,
  "base_unit_name" varchar,
  "unit_price" numeric(20,5),
  "sub_total_price" numeric(20,5),
  "base_sub_total_price" numeric(20,5),
  "is_foc" bool DEFAULT false,
  "is_tax_included" bool DEFAULT false,
  "tax_type_inventory_id" uuid,
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5),
  "tax_amount" numeric(20,5),
  "is_tax_adjustment" bool DEFAULT false,
  "is_discount" bool DEFAULT false,
  "discount_rate" numeric(15,5) DEFAULT 0,
  "discount_amount" numeric(20,5) DEFAULT 0,
  "is_discount_adjustment" bool DEFAULT false,
  "net_amount" numeric(20,5) DEFAULT 0,
  "base_net_amount" numeric(20,5) DEFAULT 0,
  "total_price" numeric(20,5),
  "base_total_price" numeric(20,5),
  "info" json,
  "history" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_vendor_business_type" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_vendor" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "description" text,
  "business_type_id" uuid,
  "business_type_name" varchar,
  "info" json,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_price_list" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "vendor_id" uuid,
  "from_date" timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "to_date" timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "unit_id" uuid,
  "unit_name" varchar,
  "price" numeric(20,5),
  "price_without_tax" numeric(20,5),
  "price_with_tax" numeric(20,5),
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_vendor_contact" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "vendor_id" uuid,
  "contact_type" enum_vendor_contact_type NOT NULL,
  "description" text,
  "is_active" bool DEFAULT true,
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_vendor_address" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "vendor_id" uuid,
  "address_type" enum_vendor_address_type,
  "data" json,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_product_tb_vendor" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "vendor_id" uuid,
  "vendor_product_code" varchar,
  "vendor_product_name" varchar,
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_inventory_transaction" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_doc_type" enum_inventory_doc_type NOT NULL,
  "inventory_doc_no" uuid NOT NULL,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_inventory_transaction_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid NOT NULL,
  "from_lot_name" varchar,
  "current_lot_name" varchar,
  "qty" numeric(20,5),
  "unit_cost" numeric(20,5),
  "total_cost" numeric(20,5),
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_inventory_transaction_closing_balance" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_detail_id" uuid NOT NULL,
  "lot_name" varchar,
  "lot_index" integer NOT NULL DEFAULT 1,
  "qty" numeric(20,5),
  "cost" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_good_received_note" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_good_received_note_status NOT NULL DEFAULT 'draft',
  "doc_type" enum_good_received_note_type NOT NULL DEFAULT 'purchase_order',
  "vendor_id" uuid,
  "vendor_name" varchar,
  "currency_id" uuid NOT NULL,
  "currency_name" varchar,
  "currency_rate" numeric(15,5) DEFAULT 1,
  "notes" text,
  "workflow" json,
  "signature_image_url" varchar,
  "received_by_id" uuid,
  "received_by_name" varchar,
  "received_at" timestamptz,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_good_received_note_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "good_received_note_id" uuid NOT NULL,
  "purchase_order_detail_id" uuid,
  "sequence_no" integer NOT NULL DEFAULT 1,
  "location_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "order_qty" numeric(20,5),
  "order_unit_id" uuid NOT NULL,
  "order_unit_name" varchar,
  "received_qty" numeric(20,5),
  "received_unit_id" uuid NOT NULL,
  "received_unit_name" varchar,
  "is_foc" bool DEFAULT false,
  "foc_qty" numeric(20,5),
  "foc_unit_id" uuid,
  "foc_unit_name" varchar,
  "price" numeric(20,5),
  "tax_type_inventory_id" uuid,
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5),
  "tax_amount" numeric(20,5),
  "is_tax_adjustment" bool DEFAULT false,
  "total_amount" numeric(20,5),
  "delivery_point_id" uuid,
  "base_price" numeric(20,5),
  "base_qty" numeric(20,5),
  "extra_cost" numeric(20,5),
  "total_cost" numeric(20,5),
  "is_discount" bool DEFAULT false,
  "discount_rate" numeric(15,5) DEFAULT 0,
  "discount_amount" numeric(20,5),
  "is_discount_adjustment" bool DEFAULT false,
  "lot_number" varchar,
  "expired_date" timestamptz,
  "info" json,
  "comment" text,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_extra_cost_type" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "description" text,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_extra_cost" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "good_received_note_id" uuid,
  "allocate_extracost_type" enum_allocate_extracost_type,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_extra_cost_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "extra_cost_id" uuid NOT NULL,
  "extra_cost_type_id" uuid NOT NULL,
  "extra_cost_type_name" varchar,
  "amount" numeric(20,5),
  "is_tax" bool DEFAULT false,
  "tax_type_inventory_id" uuid,
  "tax_type" enum_tax_type DEFAULT 'none',
  "tax_rate" numeric(15,5),
  "tax_amount" numeric(20,5),
  "is_tax_adjustment" bool DEFAULT false,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_store_requisition" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_doc_status NOT NULL DEFAULT 'draft',
  "workflow" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_store_requisition_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "store_requisition_id" uuid NOT NULL,
  "name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_in" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_doc_status NOT NULL DEFAULT 'draft',
  "workflow" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_in_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "stock_in_id" uuid NOT NULL,
  "name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_out" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_doc_status NOT NULL DEFAULT 'draft',
  "workflow" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_out_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "stock_out_id" uuid NOT NULL,
  "name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_credit_note" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_doc_status NOT NULL DEFAULT 'draft',
  "workflow" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_credit_note_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "credit_note_id" uuid NOT NULL,
  "name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5),
  "amount" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_take" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar,
  "ref_no" varchar,
  "doc_status" enum_doc_status NOT NULL DEFAULT 'draft',
  "workflow" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_stock_take_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "inventory_transaction_id" uuid,
  "stock_take_id" uuid NOT NULL,
  "name" varchar,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5),
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_count_stock" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "start_date" timestamptz NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "end_date" timestamptz,
  "location_id" uuid NOT NULL,
  "notes" text,
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_count_stock_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "count_stock_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "product_name" varchar,
  "qty" numeric(20,5) NOT NULL,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_jv_header" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "currency_id" uuid NOT NULL,
  "exchange_rate" numeric(15,5) NOT NULL,
  "base_currency_id" uuid NOT NULL,
  "jv_type" varchar(255) NOT NULL,
  "jv_number" varchar(255) NOT NULL,
  "jv_date" timestamptz NOT NULL,
  "jv_description" text,
  "jv_status" enum_jv_status NOT NULL,
  "workflow" json,
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_jv_detail" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "jv_header_id" uuid NOT NULL,
  "account_code" uuid,
  "account_name" varchar NOT NULL,
  "currency_id" uuid NOT NULL,
  "exchange_rate" numeric(15,5) NOT NULL,
  "debit" numeric(20,5) NOT NULL DEFAULT 0,
  "credit" numeric(20,5) NOT NULL DEFAULT 0,
  "base_currency_id" uuid NOT NULL,
  "base_debit" numeric(20,5) NOT NULL DEFAULT 0,
  "base_credit" numeric(20,5) NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_attachment" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "filename" varchar(255),
  "filetype" varchar(255),
  "data" bytea,
  "info" json
);

CREATE TABLE "tb_config_running_code" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "type" varchar(255),
  "config" json DEFAULT '{}',
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_currency_comment" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "type" enum_comment_type NOT NULL DEFAULT 'user',
  "user_id" uuid,
  "message" text,
  "attachments" json DEFAULT '{}',
  "info" json DEFAULT '{}',
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_unit_comment" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "type" enum_comment_type NOT NULL DEFAULT 'user',
  "user_id" uuid,
  "message" text,
  "attachments" json DEFAULT '{}',
  "info" json DEFAULT '{}',
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_dimension" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "key" varchar NOT NULL,
  "type" enum_dimension_type NOT NULL DEFAULT 'string',
  "value" json,
  "description" text,
  "default_value" json,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE TABLE "tb_dimension_display_in" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "dimension_id" uuid NOT NULL,
  "display_in" enum_dimension_display_in NOT NULL,
  "default_value" json,
  "info" json,
  "created_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "created_by_id" uuid,
  "updated_at" timestamptz DEFAULT (CURRENT_TIMESTAMP),
  "updated_by_id" uuid
);

CREATE INDEX "activity_entitytype_entityid_idx" ON "tb_activity" ("entity_type", "entity_id");

CREATE INDEX "menu_name_u" ON "tb_menu" ("name");

CREATE INDEX "currency_code_u" ON "tb_currency" ("code");

CREATE UNIQUE INDEX "exchangerate_at_date_currency_u" ON "tb_exchange_rate" ("at_date", "currency_id");

CREATE INDEX "location_name_u" ON "tb_location" ("name");

CREATE INDEX "deliverypoint_name_u" ON "tb_delivery_point" ("name");

CREATE INDEX "unit_name_u" ON "tb_unit" ("name");

CREATE INDEX "unitconversion_product_unit_type_from_unit_to_unit_u" ON "tb_unit_conversion" ("product_id", "unit_type", "from_unit_id", "to_unit_id");

CREATE INDEX "department_name_u" ON "tb_department" ("name");

CREATE UNIQUE INDEX "department_user_u" ON "tb_department_user" ("department_id", "user_id");

CREATE UNIQUE INDEX "user_location_u" ON "tb_user_location" ("user_id", "location_id");

CREATE INDEX "product_code_u" ON "tb_product" ("code");

CREATE INDEX "product_name_u" ON "tb_product" ("name");

CREATE INDEX "productinfo_product_u" ON "tb_product_info" ("product_id");

CREATE INDEX "tax_type_inventory_name_u" ON "tb_tax_type_inventory" ("name");

CREATE UNIQUE INDEX "product_location_u" ON "tb_product_location" ("product_id", "location_id");

CREATE INDEX "productcategory_code_u" ON "tb_product_category" ("code");

CREATE INDEX "productcategory_name_u" ON "tb_product_category" ("name");

CREATE UNIQUE INDEX "productsubcategory_code_name_product_category_u" ON "tb_product_sub_category" ("code", "name", "product_category_id");

CREATE UNIQUE INDEX "productitemgroup_code_name_product_subcategory_u" ON "tb_product_item_group" ("code", "name", "product_subcategory_id");

CREATE INDEX "workflow_name_u" ON "tb_workflow" ("name");

CREATE INDEX "PR0_reference_name_u" ON "tb_purchase_request" ("reference_name");

CREATE UNIQUE INDEX "PR1_purchase_request_product_location_u" ON "tb_purchase_request_detail" ("purchase_request_id", "product_id", "location_id");

CREATE INDEX "credit_term_name_u" ON "tb_credit_term" ("name");

CREATE INDEX "PO_name_u" ON "tb_purchase_order" ("name");

CREATE INDEX "PO1_name_u" ON "tb_purchase_order_detail" ("name");

CREATE INDEX "vendor_business_type_name_u" ON "tb_vendor_business_type" ("name");

CREATE INDEX "vendor_name_u" ON "tb_vendor" ("name");

CREATE INDEX "vendorcontact_vendor_contact_type_idx" ON "tb_vendor_contact" ("vendor_id", "contact_type");

CREATE INDEX "vendoraddress_vendor_address_type_idx" ON "tb_vendor_address" ("vendor_id", "address_type");

CREATE UNIQUE INDEX "product_vendor_vendor_product_u" ON "tb_product_tb_vendor" ("vendor_id", "product_id");

CREATE INDEX "inventorytransaction_inventory_doc_no_idx" ON "tb_inventory_transaction" ("inventory_doc_no");

CREATE UNIQUE INDEX "inventorytransactionclosingbalance_lotname_lot_index_u" ON "tb_inventory_transaction_closing_balance" ("lot_name", "lot_index");

CREATE UNIQUE INDEX "creditnote_name_u" ON "tb_credit_note" ("name");

CREATE UNIQUE INDEX "creditnotedetail_credit_note_name_u" ON "tb_credit_note_detail" ("credit_note_id", "name");

CREATE UNIQUE INDEX "jv_header_jv_number_jv_date_u" ON "tb_jv_header" ("jv_number", "jv_date");

CREATE UNIQUE INDEX "currency_comment_type_user_id_u" ON "tb_currency_comment" ("type", "user_id");

CREATE UNIQUE INDEX "unit_comment_type_user_id_u" ON "tb_unit_comment" ("type", "user_id");

CREATE UNIQUE INDEX "dimension_key_u" ON "tb_dimension" ("key");

COMMENT ON COLUMN "tb_activity"."id" IS 'รหัสกิจกรรม';

COMMENT ON COLUMN "tb_activity"."action" IS 'การกระทำ';

COMMENT ON COLUMN "tb_activity"."entity_type" IS 'ประเภทของข้อมูล';

COMMENT ON COLUMN "tb_activity"."entity_id" IS 'รหัสของข้อมูล';

COMMENT ON COLUMN "tb_activity"."actor_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_activity"."meta_data" IS 'ข้อมูลเสริม';

COMMENT ON COLUMN "tb_activity"."old_data" IS 'ข้อมูลเก่า';

COMMENT ON COLUMN "tb_activity"."new_data" IS 'ข้อมูลใหม่';

COMMENT ON COLUMN "tb_activity"."ip_address" IS 'ที่อยู่ IP';

COMMENT ON COLUMN "tb_activity"."user_agent" IS 'ตัวติดต่อ';

COMMENT ON COLUMN "tb_activity"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_activity"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_activity"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_menu"."id" IS 'รหัสเมนู';

COMMENT ON COLUMN "tb_menu"."module_id" IS 'รหัสโมดูล';

COMMENT ON COLUMN "tb_menu"."name" IS 'ชื่อเมนู';

COMMENT ON COLUMN "tb_menu"."url" IS 'ลิงค์';

COMMENT ON COLUMN "tb_menu"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_menu"."is_visible" IS 'แสดง';

COMMENT ON COLUMN "tb_menu"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_menu"."is_lock" IS 'ล็อค';

COMMENT ON COLUMN "tb_menu"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_menu"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_menu"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_menu"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_currency"."id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_currency"."code" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_currency"."name" IS 'ชื่อสกุลเงิน';

COMMENT ON COLUMN "tb_currency"."symbol" IS 'สัญลักษณ์';

COMMENT ON COLUMN "tb_currency"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_currency"."decimal_places" IS 'จำนวนทศนิยม';

COMMENT ON COLUMN "tb_currency"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_currency"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_currency"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_currency"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_currency"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_currency"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_exchange_rate"."id" IS 'รหัสอัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_exchange_rate"."at_date" IS 'วันที่';

COMMENT ON COLUMN "tb_exchange_rate"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_exchange_rate"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_exchange_rate"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_exchange_rate"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_exchange_rate"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_exchange_rate"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_location"."id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_location"."name" IS 'ชื่อสถานที่';

COMMENT ON COLUMN "tb_location"."location_type" IS 'ประเภทสถานที่';

COMMENT ON COLUMN "tb_location"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_location"."info" IS 'ข้อมูลเสริม';

COMMENT ON COLUMN "tb_location"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_location"."delivery_point_id" IS 'รหัสจุดส่งสินค้า';

COMMENT ON COLUMN "tb_location"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_location"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_location"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_location"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_delivery_point"."id" IS 'รหัสจุดส่งสินค้า';

COMMENT ON COLUMN "tb_delivery_point"."name" IS 'ชื่อจุดส่งสินค้า';

COMMENT ON COLUMN "tb_delivery_point"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_delivery_point"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_delivery_point"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_delivery_point"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_delivery_point"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit"."id" IS 'รหัสหน่วยนับ';

COMMENT ON COLUMN "tb_unit"."name" IS 'ชื่อหน่วยนับ';

COMMENT ON COLUMN "tb_unit"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_unit"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_unit"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_unit"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_unit"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit_conversion"."id" IS 'รหัสการแปลงหน่วย';

COMMENT ON COLUMN "tb_unit_conversion"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_unit_conversion"."unit_type" IS 'ประเภทหน่วยนับ';

COMMENT ON COLUMN "tb_unit_conversion"."from_unit_id" IS 'รหัสหน่วยนับจาก';

COMMENT ON COLUMN "tb_unit_conversion"."from_unit_name" IS 'ชื่อหน่วยนับจาก';

COMMENT ON COLUMN "tb_unit_conversion"."from_unit_qty" IS 'จำนวนหน่วยนับจาก';

COMMENT ON COLUMN "tb_unit_conversion"."to_unit_id" IS 'รหัสหน่วยนับไป';

COMMENT ON COLUMN "tb_unit_conversion"."to_unit_name" IS 'ชื่อหน่วยนับไป';

COMMENT ON COLUMN "tb_unit_conversion"."to_unit_qty" IS 'จำนวนหน่วยนับไป';

COMMENT ON COLUMN "tb_unit_conversion"."is_default" IS 'เป็นค่าเริ่มต้น';

COMMENT ON COLUMN "tb_unit_conversion"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_unit_conversion"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_unit_conversion"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_unit_conversion"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit_conversion"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_unit_conversion"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_department"."id" IS 'รหัสหน่วยงาน';

COMMENT ON COLUMN "tb_department"."name" IS 'ชื่อหน่วยงาน';

COMMENT ON COLUMN "tb_department"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_department"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_department"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_department"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_department"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_department"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_department_user"."id" IS 'รหัสผู้ใช้งานหน่วยงาน';

COMMENT ON COLUMN "tb_department_user"."user_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_department_user"."department_id" IS 'รหัสหน่วยงาน';

COMMENT ON COLUMN "tb_department_user"."is_hod" IS 'เป็นหัวหน่วยงาน';

COMMENT ON COLUMN "tb_department_user"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_department_user"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_department_user"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_department_user"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_user_location"."id" IS 'รหัสผู้ใช้งานสถานที่';

COMMENT ON COLUMN "tb_user_location"."user_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_user_location"."location_id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_user_location"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_user_location"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_user_location"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_user_location"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product"."id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product"."code" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product"."name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_product"."local_name" IS 'ชื่อสินค้าในภาษาท้องถิ่น';

COMMENT ON COLUMN "tb_product"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_product"."inventory_unit_id" IS 'รหัสหน่วยนับสินค้า';

COMMENT ON COLUMN "tb_product"."inventory_unit_name" IS 'ชื่อหน่วยนับสินค้า';

COMMENT ON COLUMN "tb_product"."product_status_type" IS 'สถานะสินค้า';

COMMENT ON COLUMN "tb_product"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_info"."id" IS 'รหัสข้อมูลสินค้า';

COMMENT ON COLUMN "tb_product_info"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product_info"."product_item_group_id" IS 'รหัสกลุ่มสินค้า';

COMMENT ON COLUMN "tb_product_info"."is_used_in_recipe" IS 'ใช้ในสูตร';

COMMENT ON COLUMN "tb_product_info"."is_sold_directly" IS 'ขายตรง';

COMMENT ON COLUMN "tb_product_info"."barcode" IS 'บาร์โค้ด';

COMMENT ON COLUMN "tb_product_info"."price_deviation_limit" IS 'ความคลาดเคลื่อนราคา';

COMMENT ON COLUMN "tb_product_info"."qty_deviation_limit" IS 'ความคลาดเคลื่อนจำนวน';

COMMENT ON COLUMN "tb_product_info"."info" IS 'ข้อมูลเสริม';

COMMENT ON COLUMN "tb_product_info"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_info"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_info"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_info"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_tax_type_inventory"."id" IS 'รหัสประเภทภาษี';

COMMENT ON COLUMN "tb_tax_type_inventory"."name" IS 'ชื่อประเภทภาษี';

COMMENT ON COLUMN "tb_tax_type_inventory"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_tax_type_inventory"."tax_type" IS 'ประเภทภาษี';

COMMENT ON COLUMN "tb_tax_type_inventory"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_tax_type_inventory"."decimal_places" IS 'จำนวนทศนิยม';

COMMENT ON COLUMN "tb_tax_type_inventory"."account_code" IS 'รหัสบัญชี';

COMMENT ON COLUMN "tb_tax_type_inventory"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_tax_type_inventory"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_tax_type_inventory"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_tax_type_inventory"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_tax_type_inventory"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_location"."id" IS 'รหัสสินค้าสถานที่';

COMMENT ON COLUMN "tb_product_location"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product_location"."location_id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_product_location"."min_qty" IS 'จำนวนสินค้าขั้นต่ำ';

COMMENT ON COLUMN "tb_product_location"."max_qty" IS 'จำนวนสินค้าขั้นสูง';

COMMENT ON COLUMN "tb_product_location"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_location"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_location"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_location"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_category"."id" IS 'รหัสหมวดสินค้า';

COMMENT ON COLUMN "tb_product_category"."code" IS 'รหัสหมวดสินค้า';

COMMENT ON COLUMN "tb_product_category"."name" IS 'ชื่อหมวดสินค้า';

COMMENT ON COLUMN "tb_product_category"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_product_category"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_product_category"."price_deviation_limit" IS 'ความคลาดเคลื่อนราคา';

COMMENT ON COLUMN "tb_product_category"."qty_deviation_limit" IS 'ความคลาดเคลื่อนจำนวน';

COMMENT ON COLUMN "tb_product_category"."is_used_in_recipe" IS 'ใช้ในสูตร';

COMMENT ON COLUMN "tb_product_category"."is_sold_directly" IS 'ขายตรง';

COMMENT ON COLUMN "tb_product_category"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_category"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_category"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_category"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_sub_category"."id" IS 'รหัสหมวดสินค้าย่อย';

COMMENT ON COLUMN "tb_product_sub_category"."code" IS 'รหัสหมวดสินค้าย่อย';

COMMENT ON COLUMN "tb_product_sub_category"."name" IS 'ชื่อหมวดสินค้าย่อย';

COMMENT ON COLUMN "tb_product_sub_category"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_product_sub_category"."price_deviation_limit" IS 'ความคลาดเคลื่อนราคา';

COMMENT ON COLUMN "tb_product_sub_category"."qty_deviation_limit" IS 'ความคลาดเคลื่อนจำนวน';

COMMENT ON COLUMN "tb_product_sub_category"."is_used_in_recipe" IS 'ใช้ในสูตร';

COMMENT ON COLUMN "tb_product_sub_category"."is_sold_directly" IS 'ขายตรง';

COMMENT ON COLUMN "tb_product_sub_category"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_product_sub_category"."product_category_id" IS 'รหัสหมวดสินค้า';

COMMENT ON COLUMN "tb_product_sub_category"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_sub_category"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_sub_category"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_sub_category"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_item_group"."id" IS 'รหัสกลุ่มสินค้า';

COMMENT ON COLUMN "tb_product_item_group"."code" IS 'รหัสกลุ่มสินค้า';

COMMENT ON COLUMN "tb_product_item_group"."name" IS 'ชื่อกลุ่มสินค้า';

COMMENT ON COLUMN "tb_product_item_group"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_product_item_group"."price_deviation_limit" IS 'ความคลาดเคลื่อนราคา';

COMMENT ON COLUMN "tb_product_item_group"."qty_deviation_limit" IS 'ความคลาดเคลื่อนจำนวน';

COMMENT ON COLUMN "tb_product_item_group"."is_used_in_recipe" IS 'ใช้ในสูตร';

COMMENT ON COLUMN "tb_product_item_group"."is_sold_directly" IS 'ขายตรง';

COMMENT ON COLUMN "tb_product_item_group"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_product_item_group"."product_subcategory_id" IS 'รหัสหมวดสินค้าย่อย';

COMMENT ON COLUMN "tb_product_item_group"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_item_group"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_item_group"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_item_group"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_workflow"."id" IS 'รหัสกระบวนการ';

COMMENT ON COLUMN "tb_workflow"."name" IS 'ชื่อกระบวนการ';

COMMENT ON COLUMN "tb_workflow"."workflow_type" IS 'ประเภทกระบวนการ';

COMMENT ON COLUMN "tb_workflow"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_workflow"."data" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_workflow"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_workflow"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_workflow"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_workflow"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_workflow"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_request"."id" IS 'รหัสการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."reference_name" IS 'รหัสการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."purchase_request_date" IS 'วันที่ขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."workflow_id" IS 'รหัสกระบวนการ';

COMMENT ON COLUMN "tb_purchase_request"."workflow_obj" IS 'ข้อมูลกระบวนการ';

COMMENT ON COLUMN "tb_purchase_request"."workflow_history" IS 'ประวัติการดำเนินการ';

COMMENT ON COLUMN "tb_purchase_request"."current_workflow_status" IS 'สถานะกระบวนการ';

COMMENT ON COLUMN "tb_purchase_request"."purchase_request_status" IS 'สถานะการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."requestor_id" IS 'ผู้ขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."requestor_name" IS 'ชื่อผู้ขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request"."department_id" IS 'หน่วยงาน';

COMMENT ON COLUMN "tb_purchase_request"."department_name" IS 'ชื่อหน่วยงาน';

COMMENT ON COLUMN "tb_purchase_request"."job_code" IS 'รหัสตำแหน่ง';

COMMENT ON COLUMN "tb_purchase_request"."budget_code" IS 'รหัสงบประมาณ';

COMMENT ON COLUMN "tb_purchase_request"."allocated_budget_amount" IS 'งบประมาณที่จัดสรร';

COMMENT ON COLUMN "tb_purchase_request"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_purchase_request"."doc_version" IS 'รุ่น';

COMMENT ON COLUMN "tb_purchase_request"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_purchase_request"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_request"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_purchase_request"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_request_detail"."id" IS 'รหัสรายการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request_detail"."purchase_request_id" IS 'รหัสการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request_detail"."location_id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_purchase_request_detail"."location_name" IS 'ชื่อสถานที่';

COMMENT ON COLUMN "tb_purchase_request_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_purchase_request_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_purchase_request_detail"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_purchase_request_detail"."vendor_name" IS 'ชื่อผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_purchase_request_detail"."price_list_id" IS 'รหัสราคาสินค้า';

COMMENT ON COLUMN "tb_purchase_request_detail"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_purchase_request_detail"."requested_qty" IS 'จำนวนขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request_detail"."requested_unit_id" IS 'รหัสหน่วยนับขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request_detail"."requested_unit_name" IS 'ชื่อหน่วยนับขอซื้อ';

COMMENT ON COLUMN "tb_purchase_request_detail"."approved_qty" IS 'จำนวนอนุมัติ';

COMMENT ON COLUMN "tb_purchase_request_detail"."approved_unit_id" IS 'รหัสหน่วยนับอนุมัติ';

COMMENT ON COLUMN "tb_purchase_request_detail"."approved_unit_name" IS 'ชื่อหน่วยนับอนุมัติ';

COMMENT ON COLUMN "tb_purchase_request_detail"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_purchase_request_detail"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_purchase_request_detail"."exchange_rate_date" IS 'วันที่อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_purchase_request_detail"."price" IS 'ราคา';

COMMENT ON COLUMN "tb_purchase_request_detail"."total_price" IS 'ราคารวม';

COMMENT ON COLUMN "tb_purchase_request_detail"."foc" IS 'จำนวของแถม';

COMMENT ON COLUMN "tb_purchase_request_detail"."foc_unit_id" IS 'รหัสหน่วยนับแถม';

COMMENT ON COLUMN "tb_purchase_request_detail"."foc_unit_name" IS 'ชื่อหน่วยนับแถม';

COMMENT ON COLUMN "tb_purchase_request_detail"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_purchase_request_detail"."tax_amount" IS 'จำนวนภาษี';

COMMENT ON COLUMN "tb_purchase_request_detail"."is_tax_adjustment" IS 'ปรับภาษี';

COMMENT ON COLUMN "tb_purchase_request_detail"."is_discount" IS 'ส่วนลด';

COMMENT ON COLUMN "tb_purchase_request_detail"."discount_rate" IS 'อัตราส่วนลด';

COMMENT ON COLUMN "tb_purchase_request_detail"."discount_amount" IS 'จำนวนส่วนลด';

COMMENT ON COLUMN "tb_purchase_request_detail"."is_discount_adjustment" IS 'ปรับส่วนลด';

COMMENT ON COLUMN "tb_purchase_request_detail"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_purchase_request_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_purchase_request_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_request_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_purchase_request_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_term"."id" IS 'รหัสระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_credit_term"."name" IS 'ชื่อระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_credit_term"."value" IS 'ค่าระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_credit_term"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_credit_term"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_credit_term"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_credit_term"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_term"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_credit_term"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_order"."id" IS 'รหัสการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."name" IS 'รหัสการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."purchase_order_status" IS 'สถานะการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_purchase_order"."order_date" IS 'วันที่สั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."delivery_date" IS 'วันที่ส่งสินค้า';

COMMENT ON COLUMN "tb_purchase_order"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_purchase_order"."vendor_name" IS 'ชื่อผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_purchase_order"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_purchase_order"."currency_name" IS 'ชื่อสกุลเงิน';

COMMENT ON COLUMN "tb_purchase_order"."base_currency_id" IS 'รหัสสกุลเงินหลัก';

COMMENT ON COLUMN "tb_purchase_order"."base_currency_name" IS 'ชื่อสกุลเงินหลัก';

COMMENT ON COLUMN "tb_purchase_order"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_purchase_order"."notes" IS 'หมายเหตุ';

COMMENT ON COLUMN "tb_purchase_order"."approval_date" IS 'วันที่อนุมัติ';

COMMENT ON COLUMN "tb_purchase_order"."email" IS 'อีเมล';

COMMENT ON COLUMN "tb_purchase_order"."buyer_id" IS 'รหัสผู้ซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."buyer_name" IS 'ชื่อผู้ซื้อ';

COMMENT ON COLUMN "tb_purchase_order"."credit_term_id" IS 'ระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_purchase_order"."credit_term_name" IS 'ชื่อระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_purchase_order"."credit_term_value" IS 'ค่าระยะเวลาชำระเงิน';

COMMENT ON COLUMN "tb_purchase_order"."remarks" IS 'หมายเหตุ';

COMMENT ON COLUMN "tb_purchase_order"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_purchase_order"."history" IS 'ประวัติ';

COMMENT ON COLUMN "tb_purchase_order"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_purchase_order"."doc_version" IS 'รุ่น';

COMMENT ON COLUMN "tb_purchase_order"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_purchase_order"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_order"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_purchase_order"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_order_detail"."id" IS 'รหัสรายการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."name" IS 'รหัสรายการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_purchase_order_detail"."purchase_order_id" IS 'รหัสการสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."purchase_request_detail_id" IS 'รหัสรายการขอซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_purchase_order_detail"."order_qty" IS 'จำนวนสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."order_unit_id" IS 'รหัสหน่วยนับสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."order_unit_name" IS 'ชื่อหน่วยนับสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_qty" IS 'จำนวนสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_unit_id" IS 'รหัสหน่วยนับสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_unit_name" IS 'ชื่อหน่วยนับสั่งซื้อ';

COMMENT ON COLUMN "tb_purchase_order_detail"."unit_price" IS 'ราคาต่อหน่วย';

COMMENT ON COLUMN "tb_purchase_order_detail"."sub_total_price" IS 'ราคารวม';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_sub_total_price" IS 'ราคารวม';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_foc" IS 'แถม';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_tax_included" IS 'รวมภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."tax_type_inventory_id" IS 'รหัสประเภทภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."tax_type" IS 'ประเภทภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."tax_amount" IS 'จำนวนภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_tax_adjustment" IS 'ปรับภาษี';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_discount" IS 'ส่วนลด';

COMMENT ON COLUMN "tb_purchase_order_detail"."discount_rate" IS 'อัตราส่วนลด';

COMMENT ON COLUMN "tb_purchase_order_detail"."discount_amount" IS 'จำนวนส่วนลด';

COMMENT ON COLUMN "tb_purchase_order_detail"."is_discount_adjustment" IS 'ปรับส่วนลด';

COMMENT ON COLUMN "tb_purchase_order_detail"."net_amount" IS 'ราคาสุทธิ';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_net_amount" IS 'ราคาสุทธิ';

COMMENT ON COLUMN "tb_purchase_order_detail"."total_price" IS 'ราคารวม';

COMMENT ON COLUMN "tb_purchase_order_detail"."base_total_price" IS 'ราคารวม';

COMMENT ON COLUMN "tb_purchase_order_detail"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_purchase_order_detail"."history" IS 'ประวัติ';

COMMENT ON COLUMN "tb_purchase_order_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_purchase_order_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_purchase_order_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_purchase_order_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_business_type"."id" IS 'รหัสประเภทธุรกิจ';

COMMENT ON COLUMN "tb_vendor_business_type"."name" IS 'ชื่อประเภทธุรกิจ';

COMMENT ON COLUMN "tb_vendor_business_type"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_vendor_business_type"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_vendor_business_type"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_vendor_business_type"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_business_type"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_vendor_business_type"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor"."id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_vendor"."name" IS 'ชื่อผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_vendor"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_vendor"."business_type_id" IS 'รหัสประเภทธุรกิจ';

COMMENT ON COLUMN "tb_vendor"."business_type_name" IS 'ชื่อประเภทธุรกิจ';

COMMENT ON COLUMN "tb_vendor"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_vendor"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_vendor"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_vendor"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_vendor"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_price_list"."id" IS 'รหัสราคาสินค้า';

COMMENT ON COLUMN "tb_price_list"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_price_list"."from_date" IS 'วันที่เริ่มต้น';

COMMENT ON COLUMN "tb_price_list"."to_date" IS 'วันที่สิ้นสุด';

COMMENT ON COLUMN "tb_price_list"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_price_list"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_price_list"."unit_id" IS 'รหัสหน่วยนับ';

COMMENT ON COLUMN "tb_price_list"."unit_name" IS 'ชื่อหน่วยนับ';

COMMENT ON COLUMN "tb_price_list"."price" IS 'ราคา';

COMMENT ON COLUMN "tb_price_list"."price_without_tax" IS 'ราคาไม่รวมภาษี';

COMMENT ON COLUMN "tb_price_list"."price_with_tax" IS 'ราคารวมภาษี';

COMMENT ON COLUMN "tb_price_list"."tax_type" IS 'ประเภทภาษี';

COMMENT ON COLUMN "tb_price_list"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_price_list"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_price_list"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_price_list"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_price_list"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_contact"."id" IS 'รหัสติดต่อ';

COMMENT ON COLUMN "tb_vendor_contact"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_vendor_contact"."contact_type" IS 'ประเภทติดต่อ';

COMMENT ON COLUMN "tb_vendor_contact"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_vendor_contact"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_vendor_contact"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_vendor_contact"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_contact"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_vendor_contact"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_address"."id" IS 'รหัสที่ติดต่อ';

COMMENT ON COLUMN "tb_vendor_address"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_vendor_address"."address_type" IS 'ประเภทที่ติดต่อ';

COMMENT ON COLUMN "tb_vendor_address"."data" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_vendor_address"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_vendor_address"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_vendor_address"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_vendor_address"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_vendor_address"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_tb_vendor"."id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product_tb_vendor"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_product_tb_vendor"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_product_tb_vendor"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_product_tb_vendor"."vendor_product_code" IS 'รหัสสินค้าของผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_product_tb_vendor"."vendor_product_name" IS 'ชื่อสินค้าของผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_product_tb_vendor"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_product_tb_vendor"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_product_tb_vendor"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_product_tb_vendor"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_product_tb_vendor"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_product_tb_vendor"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction"."id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction"."inventory_doc_type" IS 'ประเภทรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction"."inventory_doc_no" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_inventory_transaction"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_inventory_transaction"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."from_lot_name" IS 'รหัสล็อต';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."current_lot_name" IS 'รหัสล็อต';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."unit_cost" IS 'ราคาต่อหน่วย';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."total_cost" IS 'ราคารวม';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_inventory_transaction_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."inventory_transaction_detail_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."lot_name" IS 'รหัสล็อต';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."lot_index" IS 'ลำดับล็อต';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."cost" IS 'ราคา';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_inventory_transaction_closing_balance"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_good_received_note"."id" IS 'รหัสใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."name" IS 'ชื่อใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."ref_no" IS 'รหัสใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."doc_status" IS 'สถานะใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."doc_type" IS 'ประเภทใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."vendor_id" IS 'รหัสผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_good_received_note"."vendor_name" IS 'ชื่อผู้จัดจำหน่าย';

COMMENT ON COLUMN "tb_good_received_note"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_good_received_note"."currency_name" IS 'ชื่อสกุลเงิน';

COMMENT ON COLUMN "tb_good_received_note"."currency_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_good_received_note"."notes" IS 'บันทึก';

COMMENT ON COLUMN "tb_good_received_note"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_good_received_note"."signature_image_url" IS 'ลิงค์รูปภาพ';

COMMENT ON COLUMN "tb_good_received_note"."received_by_id" IS 'รหัสผู้รับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."received_by_name" IS 'ชื่อผู้รับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."received_at" IS 'วันที่รับสินค้า';

COMMENT ON COLUMN "tb_good_received_note"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_good_received_note"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_good_received_note"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_good_received_note"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_good_received_note_detail"."id" IS 'รหัสรายการใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_good_received_note_detail"."good_received_note_id" IS 'รหัสใบรับสินค้า';

COMMENT ON COLUMN "tb_good_received_note_detail"."purchase_order_detail_id" IS 'รหัสรายการใบสั่งซื้อ';

COMMENT ON COLUMN "tb_good_received_note_detail"."sequence_no" IS 'ลำดับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."location_id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_good_received_note_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_good_received_note_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_good_received_note_detail"."order_qty" IS 'จำนวนสั่งซื้อ';

COMMENT ON COLUMN "tb_good_received_note_detail"."order_unit_id" IS 'รหัสหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."order_unit_name" IS 'ชื่อหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."received_qty" IS 'จำนวนรับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."received_unit_id" IS 'รหัสหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."received_unit_name" IS 'ชื่อหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."is_foc" IS 'สินค้า FOC';

COMMENT ON COLUMN "tb_good_received_note_detail"."foc_qty" IS 'จำนวน FOC';

COMMENT ON COLUMN "tb_good_received_note_detail"."foc_unit_id" IS 'รหัสหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."foc_unit_name" IS 'ชื่อหน่วยนับ';

COMMENT ON COLUMN "tb_good_received_note_detail"."price" IS 'ราคา';

COMMENT ON COLUMN "tb_good_received_note_detail"."tax_type_inventory_id" IS 'รหัสประเภทภาษี';

COMMENT ON COLUMN "tb_good_received_note_detail"."tax_type" IS 'ประเภทภาษี';

COMMENT ON COLUMN "tb_good_received_note_detail"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_good_received_note_detail"."tax_amount" IS 'จำนวนภาษี';

COMMENT ON COLUMN "tb_good_received_note_detail"."is_tax_adjustment" IS 'ปรับปรุงภาษี';

COMMENT ON COLUMN "tb_good_received_note_detail"."total_amount" IS 'จำนวนเงิน';

COMMENT ON COLUMN "tb_good_received_note_detail"."delivery_point_id" IS 'รหัสจุดจัดส่ง';

COMMENT ON COLUMN "tb_good_received_note_detail"."base_price" IS 'ราคาฐาน';

COMMENT ON COLUMN "tb_good_received_note_detail"."base_qty" IS 'จำนวนฐาน';

COMMENT ON COLUMN "tb_good_received_note_detail"."extra_cost" IS 'ค่าใช้จ่ายพิเศษ';

COMMENT ON COLUMN "tb_good_received_note_detail"."total_cost" IS 'จำนวนเงิน';

COMMENT ON COLUMN "tb_good_received_note_detail"."is_discount" IS 'ส่วนลด';

COMMENT ON COLUMN "tb_good_received_note_detail"."discount_rate" IS 'อัตราส่วนลด';

COMMENT ON COLUMN "tb_good_received_note_detail"."discount_amount" IS 'จำนวนส่วนลด';

COMMENT ON COLUMN "tb_good_received_note_detail"."is_discount_adjustment" IS 'ปรับปรุงส่วนลด';

COMMENT ON COLUMN "tb_good_received_note_detail"."lot_number" IS 'รหัสล็อต';

COMMENT ON COLUMN "tb_good_received_note_detail"."expired_date" IS 'วันที่หมดอายุ';

COMMENT ON COLUMN "tb_good_received_note_detail"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_good_received_note_detail"."comment" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_good_received_note_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_good_received_note_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_good_received_note_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_good_received_note_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost_type"."id" IS 'รหัสประเภทค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_type"."name" IS 'ชื่อประเภทค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_type"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_extra_cost_type"."is_active" IS 'เปิด';

COMMENT ON COLUMN "tb_extra_cost_type"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_extra_cost_type"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost_type"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_extra_cost_type"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost"."id" IS 'รหัสค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost"."name" IS 'ชื่อค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost"."good_received_note_id" IS 'รหัสใบรับสินค้า';

COMMENT ON COLUMN "tb_extra_cost"."allocate_extracost_type" IS 'ประเภทการจัดสรร';

COMMENT ON COLUMN "tb_extra_cost"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_extra_cost"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_extra_cost"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost_detail"."id" IS 'รหัสรายการค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_detail"."extra_cost_id" IS 'รหัสค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_detail"."extra_cost_type_id" IS 'รหัสประเภทค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_detail"."extra_cost_type_name" IS 'ชื่อประเภทค่าใช้จ่าย';

COMMENT ON COLUMN "tb_extra_cost_detail"."amount" IS 'จำนวนเงิน';

COMMENT ON COLUMN "tb_extra_cost_detail"."is_tax" IS 'มีภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."tax_type_inventory_id" IS 'รหัสประเภทภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."tax_type" IS 'ประเภทภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."tax_rate" IS 'อัตราภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."tax_amount" IS 'จำนวนภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."is_tax_adjustment" IS 'ปรับปรุงภาษี';

COMMENT ON COLUMN "tb_extra_cost_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_extra_cost_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_extra_cost_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_extra_cost_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_store_requisition"."id" IS 'รหัสใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition"."name" IS 'ชื่อใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition"."ref_no" IS 'รหัสใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition"."doc_status" IS 'สถานะใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_store_requisition"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_store_requisition"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_store_requisition"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_store_requisition"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_store_requisition_detail"."id" IS 'รหัสรายการใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_store_requisition_detail"."store_requisition_id" IS 'รหัสใบขอซื้อ';

COMMENT ON COLUMN "tb_store_requisition_detail"."name" IS 'ชื่อรายการ';

COMMENT ON COLUMN "tb_store_requisition_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_store_requisition_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_store_requisition_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_store_requisition_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_store_requisition_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_store_requisition_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_store_requisition_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_in"."id" IS 'รหัสใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in"."name" IS 'ชื่อใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in"."ref_no" IS 'รหัสใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in"."doc_status" IS 'สถานะใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_stock_in"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_in"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_in"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_in"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_in_detail"."id" IS 'รหัสรายการใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_stock_in_detail"."stock_in_id" IS 'รหัสใบรับสินค้าเข้า';

COMMENT ON COLUMN "tb_stock_in_detail"."name" IS 'ชื่อรายการ';

COMMENT ON COLUMN "tb_stock_in_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_stock_in_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_stock_in_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_stock_in_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_in_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_in_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_in_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_out"."id" IS 'รหัสใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out"."name" IS 'ชื่อใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out"."ref_no" IS 'รหัสใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out"."doc_status" IS 'สถานะใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_stock_out"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_out"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_out"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_out"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_out_detail"."id" IS 'รหัสรายการใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_stock_out_detail"."stock_out_id" IS 'รหัสใบรับสินค้าออก';

COMMENT ON COLUMN "tb_stock_out_detail"."name" IS 'ชื่อรายการ';

COMMENT ON COLUMN "tb_stock_out_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_stock_out_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_stock_out_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_stock_out_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_out_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_out_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_out_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_note"."id" IS 'รหัสใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note"."name" IS 'ชื่อใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note"."ref_no" IS 'รหัสใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note"."doc_status" IS 'สถานะใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_credit_note"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_credit_note"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_note"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_credit_note"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_note_detail"."id" IS 'รหัสรายการใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_credit_note_detail"."credit_note_id" IS 'รหัสใบเบิกสินค้า';

COMMENT ON COLUMN "tb_credit_note_detail"."name" IS 'ชื่อรายการ';

COMMENT ON COLUMN "tb_credit_note_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_credit_note_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_credit_note_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_credit_note_detail"."amount" IS 'จำนวนเงิน';

COMMENT ON COLUMN "tb_credit_note_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_credit_note_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_credit_note_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_credit_note_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_take"."id" IS 'รหัสการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take"."name" IS 'ชื่อการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take"."ref_no" IS 'รหัสการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take"."doc_status" IS 'สถานะการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_stock_take"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_take"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_take"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_take"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_take_detail"."id" IS 'รหัสรายการการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take_detail"."inventory_transaction_id" IS 'รหัสรายการสินค้า';

COMMENT ON COLUMN "tb_stock_take_detail"."stock_take_id" IS 'รหัสการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_stock_take_detail"."name" IS 'ชื่อรายการ';

COMMENT ON COLUMN "tb_stock_take_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_stock_take_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_stock_take_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_stock_take_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_stock_take_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_stock_take_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_stock_take_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_count_stock"."id" IS 'รหัสการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_count_stock"."start_date" IS 'วันที่เริ่มต้น';

COMMENT ON COLUMN "tb_count_stock"."end_date" IS 'วันที่สิ้นสุด';

COMMENT ON COLUMN "tb_count_stock"."location_id" IS 'รหัสสถานที่';

COMMENT ON COLUMN "tb_count_stock"."notes" IS 'หมายเหตุ';

COMMENT ON COLUMN "tb_count_stock"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_count_stock"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_count_stock"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_count_stock"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_count_stock"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_count_stock_detail"."id" IS 'รหัสรายการการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_count_stock_detail"."count_stock_id" IS 'รหัสการตรวจนับสินค้า';

COMMENT ON COLUMN "tb_count_stock_detail"."product_id" IS 'รหัสสินค้า';

COMMENT ON COLUMN "tb_count_stock_detail"."product_name" IS 'ชื่อสินค้า';

COMMENT ON COLUMN "tb_count_stock_detail"."qty" IS 'จำนวน';

COMMENT ON COLUMN "tb_count_stock_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_count_stock_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_count_stock_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_count_stock_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_jv_header"."id" IS 'รหัสรายการบันทึกรายการ';

COMMENT ON COLUMN "tb_jv_header"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_jv_header"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_jv_header"."base_currency_id" IS 'รหัสสกุลเงินหลัก';

COMMENT ON COLUMN "tb_jv_header"."jv_type" IS 'ประเภทรายการ';

COMMENT ON COLUMN "tb_jv_header"."jv_number" IS 'รหัสรายการ';

COMMENT ON COLUMN "tb_jv_header"."jv_date" IS 'วันที่รายการ';

COMMENT ON COLUMN "tb_jv_header"."jv_description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_jv_header"."jv_status" IS 'สถานะ';

COMMENT ON COLUMN "tb_jv_header"."workflow" IS 'กระบวนการ';

COMMENT ON COLUMN "tb_jv_header"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_jv_header"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_jv_header"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_jv_header"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_jv_header"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_jv_detail"."id" IS 'รหัสรายการบันทึกรายการ';

COMMENT ON COLUMN "tb_jv_detail"."jv_header_id" IS 'รหัสรายการบันทึกรายการ';

COMMENT ON COLUMN "tb_jv_detail"."account_code" IS 'รหัสบัญชี';

COMMENT ON COLUMN "tb_jv_detail"."account_name" IS 'ชื่อบัญชี';

COMMENT ON COLUMN "tb_jv_detail"."currency_id" IS 'รหัสสกุลเงิน';

COMMENT ON COLUMN "tb_jv_detail"."exchange_rate" IS 'อัตราแลกเปลี่ยน';

COMMENT ON COLUMN "tb_jv_detail"."debit" IS 'ยอดเงินคงเหลือ';

COMMENT ON COLUMN "tb_jv_detail"."credit" IS 'ยอดเงินคงเหลือ';

COMMENT ON COLUMN "tb_jv_detail"."base_currency_id" IS 'รหัสสกุลเงินหลัก';

COMMENT ON COLUMN "tb_jv_detail"."base_debit" IS 'ยอดเงินคงเหลือ';

COMMENT ON COLUMN "tb_jv_detail"."base_credit" IS 'ยอดเงินคงเหลือ';

COMMENT ON COLUMN "tb_jv_detail"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_jv_detail"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_jv_detail"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_jv_detail"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_attachment"."id" IS 'รหัสแนบ';

COMMENT ON COLUMN "tb_attachment"."filename" IS 'ชื่อแนบ';

COMMENT ON COLUMN "tb_attachment"."filetype" IS 'ประเภทแนบ';

COMMENT ON COLUMN "tb_attachment"."data" IS 'ข้อมูลแนบ';

COMMENT ON COLUMN "tb_attachment"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_config_running_code"."id" IS 'รหัสการรันรหัส';

COMMENT ON COLUMN "tb_config_running_code"."type" IS 'ประเภท';

COMMENT ON COLUMN "tb_config_running_code"."config" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_config_running_code"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_config_running_code"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_config_running_code"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_config_running_code"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_currency_comment"."id" IS 'รหัสแนบ';

COMMENT ON COLUMN "tb_currency_comment"."type" IS 'ประเภท';

COMMENT ON COLUMN "tb_currency_comment"."user_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_currency_comment"."message" IS 'ข้อความ';

COMMENT ON COLUMN "tb_currency_comment"."attachments" IS 'แนบ';

COMMENT ON COLUMN "tb_currency_comment"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_currency_comment"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_currency_comment"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_currency_comment"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_currency_comment"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit_comment"."id" IS 'รหัสแนบ';

COMMENT ON COLUMN "tb_unit_comment"."type" IS 'ประเภท';

COMMENT ON COLUMN "tb_unit_comment"."user_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit_comment"."message" IS 'ข้อความ';

COMMENT ON COLUMN "tb_unit_comment"."attachments" IS 'แนบ';

COMMENT ON COLUMN "tb_unit_comment"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_unit_comment"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_unit_comment"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_unit_comment"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_unit_comment"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_dimension"."id" IS 'รหัสขนาด';

COMMENT ON COLUMN "tb_dimension"."key" IS 'คีย์';

COMMENT ON COLUMN "tb_dimension"."type" IS 'ประเภท';

COMMENT ON COLUMN "tb_dimension"."value" IS 'ค่า';

COMMENT ON COLUMN "tb_dimension"."description" IS 'คำอธิบาย';

COMMENT ON COLUMN "tb_dimension"."default_value" IS 'ค่าเริ่มต้น';

COMMENT ON COLUMN "tb_dimension"."is_active" IS 'เปิด/ปิด';

COMMENT ON COLUMN "tb_dimension"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_dimension"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_dimension"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_dimension"."updated_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_dimension_display_in"."id" IS 'รหัสค่าขนาด';

COMMENT ON COLUMN "tb_dimension_display_in"."dimension_id" IS 'รหัสขนาด';

COMMENT ON COLUMN "tb_dimension_display_in"."display_in" IS 'แสดงใน';

COMMENT ON COLUMN "tb_dimension_display_in"."default_value" IS 'ค่าเริ่มต้น';

COMMENT ON COLUMN "tb_dimension_display_in"."info" IS 'ข้อมูล';

COMMENT ON COLUMN "tb_dimension_display_in"."created_at" IS 'วันที่สร้าง';

COMMENT ON COLUMN "tb_dimension_display_in"."created_by_id" IS 'รหัสผู้ใช้งาน';

COMMENT ON COLUMN "tb_dimension_display_in"."updated_at" IS 'วันที่แก้ไข';

COMMENT ON COLUMN "tb_dimension_display_in"."updated_by_id" IS 'รหัสผู้ใช้งาน';

ALTER TABLE "tb_exchange_rate" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_location" ADD FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point" ("id");

ALTER TABLE "tb_unit_conversion" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_unit_conversion" ADD FOREIGN KEY ("from_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_unit_conversion" ADD FOREIGN KEY ("to_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_department_user" ADD FOREIGN KEY ("department_id") REFERENCES "tb_department" ("id");

ALTER TABLE "tb_user_location" ADD FOREIGN KEY ("location_id") REFERENCES "tb_location" ("id");

ALTER TABLE "tb_product" ADD FOREIGN KEY ("inventory_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_product_info" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_product_info" ADD FOREIGN KEY ("product_item_group_id") REFERENCES "tb_product_item_group" ("id");

ALTER TABLE "tb_product_location" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_product_location" ADD FOREIGN KEY ("location_id") REFERENCES "tb_location" ("id");

ALTER TABLE "tb_product_sub_category" ADD FOREIGN KEY ("product_category_id") REFERENCES "tb_product_category" ("id");

ALTER TABLE "tb_product_item_group" ADD FOREIGN KEY ("product_subcategory_id") REFERENCES "tb_product_sub_category" ("id");

ALTER TABLE "tb_purchase_request" ADD FOREIGN KEY ("workflow_id") REFERENCES "tb_workflow" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("purchase_request_id") REFERENCES "tb_purchase_request" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("location_id") REFERENCES "tb_location" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("price_list_id") REFERENCES "tb_price_list" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("requested_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("approved_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("foc_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_purchase_request_detail" ADD FOREIGN KEY ("tax_type_inventory_id") REFERENCES "tb_tax_type_inventory" ("id");

ALTER TABLE "tb_purchase_order" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_purchase_order" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_purchase_order" ADD FOREIGN KEY ("base_currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_purchase_order" ADD FOREIGN KEY ("credit_term_id") REFERENCES "tb_credit_term" ("id");

ALTER TABLE "tb_purchase_order_detail" ADD FOREIGN KEY ("purchase_order_id") REFERENCES "tb_purchase_order" ("id");

ALTER TABLE "tb_purchase_order_detail" ADD FOREIGN KEY ("purchase_request_detail_id") REFERENCES "tb_purchase_request_detail" ("id");

ALTER TABLE "tb_purchase_order_detail" ADD FOREIGN KEY ("order_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_purchase_order_detail" ADD FOREIGN KEY ("base_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_purchase_order_detail" ADD FOREIGN KEY ("tax_type_inventory_id") REFERENCES "tb_tax_type_inventory" ("id");

ALTER TABLE "tb_vendor" ADD FOREIGN KEY ("business_type_id") REFERENCES "tb_vendor_business_type" ("id");

ALTER TABLE "tb_price_list" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_price_list" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_price_list" ADD FOREIGN KEY ("unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_vendor_contact" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_vendor_address" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_product_tb_vendor" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_product_tb_vendor" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_inventory_transaction_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_inventory_transaction_closing_balance" ADD FOREIGN KEY ("inventory_transaction_detail_id") REFERENCES "tb_inventory_transaction_detail" ("id");

ALTER TABLE "tb_good_received_note" ADD FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor" ("id");

ALTER TABLE "tb_good_received_note" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("good_received_note_id") REFERENCES "tb_good_received_note" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("purchase_order_detail_id") REFERENCES "tb_purchase_order_detail" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("location_id") REFERENCES "tb_location" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("order_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("received_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("foc_unit_id") REFERENCES "tb_unit" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("tax_type_inventory_id") REFERENCES "tb_tax_type_inventory" ("id");

ALTER TABLE "tb_good_received_note_detail" ADD FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point" ("id");

ALTER TABLE "tb_extra_cost" ADD FOREIGN KEY ("good_received_note_id") REFERENCES "tb_good_received_note" ("id");

ALTER TABLE "tb_extra_cost_detail" ADD FOREIGN KEY ("extra_cost_id") REFERENCES "tb_extra_cost" ("id");

ALTER TABLE "tb_extra_cost_detail" ADD FOREIGN KEY ("extra_cost_type_id") REFERENCES "tb_extra_cost_type" ("id");

ALTER TABLE "tb_extra_cost_detail" ADD FOREIGN KEY ("tax_type_inventory_id") REFERENCES "tb_tax_type_inventory" ("id");

ALTER TABLE "tb_store_requisition_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_store_requisition_detail" ADD FOREIGN KEY ("store_requisition_id") REFERENCES "tb_store_requisition" ("id");

ALTER TABLE "tb_store_requisition_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_stock_in_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_stock_in_detail" ADD FOREIGN KEY ("stock_in_id") REFERENCES "tb_stock_in" ("id");

ALTER TABLE "tb_stock_in_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_stock_out_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_stock_out_detail" ADD FOREIGN KEY ("stock_out_id") REFERENCES "tb_stock_out" ("id");

ALTER TABLE "tb_stock_out_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_credit_note_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_credit_note_detail" ADD FOREIGN KEY ("credit_note_id") REFERENCES "tb_credit_note" ("id");

ALTER TABLE "tb_credit_note_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_stock_take_detail" ADD FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction" ("id");

ALTER TABLE "tb_stock_take_detail" ADD FOREIGN KEY ("stock_take_id") REFERENCES "tb_stock_take" ("id");

ALTER TABLE "tb_stock_take_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_count_stock" ADD FOREIGN KEY ("location_id") REFERENCES "tb_location" ("id");

ALTER TABLE "tb_count_stock_detail" ADD FOREIGN KEY ("count_stock_id") REFERENCES "tb_count_stock" ("id");

ALTER TABLE "tb_count_stock_detail" ADD FOREIGN KEY ("product_id") REFERENCES "tb_product" ("id");

ALTER TABLE "tb_jv_header" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_jv_header" ADD FOREIGN KEY ("base_currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_jv_detail" ADD FOREIGN KEY ("jv_header_id") REFERENCES "tb_jv_header" ("id");

ALTER TABLE "tb_jv_detail" ADD FOREIGN KEY ("currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_jv_detail" ADD FOREIGN KEY ("base_currency_id") REFERENCES "tb_currency" ("id");

ALTER TABLE "tb_dimension_display_in" ADD FOREIGN KEY ("dimension_id") REFERENCES "tb_dimension" ("id");
