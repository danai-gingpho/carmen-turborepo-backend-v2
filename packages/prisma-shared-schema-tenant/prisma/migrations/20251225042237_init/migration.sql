-- CreateEnum
CREATE TYPE "enum_business_unit_config_key" AS ENUM ('hotel', 'company', 'tax_id', 'branch_no', 'calculation_method', 'currency_base', 'date_format', 'long_time_format', 'short_time_format', 'timezone', 'perpage', 'amount', 'quantity', 'recipe');

-- CreateEnum
CREATE TYPE "enum_calculation_method" AS ENUM ('FIFO', 'AVG');

-- CreateEnum
CREATE TYPE "enum_physical_count_type" AS ENUM ('no', 'yes');

-- CreateEnum
CREATE TYPE "enum_activity_action" AS ENUM ('view', 'create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'cancel', 'void', 'print', 'email', 'other', 'upload', 'download', 'export', 'import', 'copy', 'move', 'rename', 'save');

-- CreateEnum
CREATE TYPE "enum_comment_type" AS ENUM ('user', 'system');

-- CreateEnum
CREATE TYPE "enum_tax_type" AS ENUM ('none', 'included', 'add');

-- CreateEnum
CREATE TYPE "enum_good_received_note_status" AS ENUM ('draft', 'saved', 'committed', 'voided');

-- CreateEnum
CREATE TYPE "enum_allocate_extra_cost_type" AS ENUM ('manual', 'by_value', 'by_qty');

-- CreateEnum
CREATE TYPE "enum_dimension_type" AS ENUM ('string', 'number', 'boolean', 'date', 'datetime', 'json', 'dataset', 'lookup', 'lookup_dataset');

-- CreateEnum
CREATE TYPE "enum_data_type" AS ENUM ('string', 'date', 'datetime', 'number', 'boolean', 'dataset', 'lookup', 'object', 'array', 'default_currency');

-- CreateEnum
CREATE TYPE "enum_jv_status" AS ENUM ('draft', 'posted');

-- CreateEnum
CREATE TYPE "enum_good_received_note_type" AS ENUM ('manual', 'purchase_order');

-- CreateEnum
CREATE TYPE "enum_product_status_type" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "enum_dimension_display_in" AS ENUM ('currency', 'exchange_rate', 'delivery_point', 'department', 'product_category', 'product_sub_category', 'product_item_group', 'product', 'location', 'vendor', 'pricelist', 'unit', 'purchase_request_header', 'purchase_request_detail', 'purchase_order_header', 'purchase_order_detail', 'goods_received_note_header', 'goods_received_note_detail', 'transfer_header', 'transfer_detail', 'stock_in_header', 'stock_in_detail', 'stock_out_header', 'stock_out_detail');

-- CreateEnum
CREATE TYPE "enum_activity_entity_type" AS ENUM ('user', 'business_unit', 'product', 'location', 'department', 'unit', 'currency', 'exchange_rate', 'menu', 'delivery_point', 'purchase_request', 'purchase_request_item', 'purchase_order', 'purchase_order_item', 'good_received_note', 'good_received_note_item', 'inventory_transaction', 'inventory_adjustment', 'store_requisition', 'store_requisition_item', 'stock_in', 'stock_out', 'stock_adjustment', 'stock_transfer', 'stock_count', 'other');

-- CreateEnum
CREATE TYPE "enum_doc_status" AS ENUM ('draft', 'in_progress', 'completed', 'cancelled', 'voided');

-- CreateEnum
CREATE TYPE "enum_credit_note_type" AS ENUM ('quantity_return', 'amount_discount');

-- CreateEnum
CREATE TYPE "enum_credit_note_doc_status" AS ENUM ('draft', 'in_progress', 'completed', 'cancelled', 'voided');

-- CreateEnum
CREATE TYPE "enum_inventory_doc_type" AS ENUM ('good_received_note', 'credit_note', 'store_requisition', 'stock_in', 'stock_out');

-- CreateEnum
CREATE TYPE "enum_location_type" AS ENUM ('inventory', 'direct', 'consignment');

-- CreateEnum
CREATE TYPE "enum_count_stock_status" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "enum_purchase_order_doc_status" AS ENUM ('draft', 'in_progress', 'sent', 'partial', 'closed', 'completed');

-- CreateEnum
CREATE TYPE "enum_purchase_request_doc_status" AS ENUM ('draft', 'in_progress', 'approved', 'completed', 'cancelled', 'voided');

-- CreateEnum
CREATE TYPE "enum_unit_type" AS ENUM ('order_unit', 'ingredient_unit');

-- CreateEnum
CREATE TYPE "enum_vendor_address_type" AS ENUM ('contact_address', 'mailing_address', 'register_address');

-- CreateEnum
CREATE TYPE "enum_workflow_type" AS ENUM ('purchase_request_workflow', 'store_requisition_workflow');

-- CreateEnum
CREATE TYPE "enum_pricelist_compare_type" AS ENUM ('automatic', 'manual_select', 'manual_input');

-- CreateEnum
CREATE TYPE "enum_transaction_type" AS ENUM ('good_received_note', 'transfer_in', 'transfer_out', 'issue', 'adjustment', 'credit_note', 'close_period', 'open_period');

-- CreateEnum
CREATE TYPE "enum_period_status" AS ENUM ('open', 'closed', 'locked');

-- CreateEnum
CREATE TYPE "enum_stage_role" AS ENUM ('create', 'approve', 'purchase', 'issue', 'view_only');

-- CreateEnum
CREATE TYPE "enum_last_action" AS ENUM ('submitted', 'approved', 'reviewed', 'rejected');

-- CreateEnum
CREATE TYPE "enum_spot_check_status" AS ENUM ('pending', 'in_progress', 'void', 'completed');

-- CreateEnum
CREATE TYPE "enum_spot_check_method" AS ENUM ('random', 'high_value', 'manual');

-- CreateEnum
CREATE TYPE "enum_pricelist_template_status" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "enum_pricelist_status" AS ENUM ('draft', 'active', 'inactive', 'expired');

-- CreateEnum
CREATE TYPE "pricelist_submission_method" AS ENUM ('online', 'email', 'portal', 'manual');

-- CreateTable
CREATE TABLE "tb_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action" "enum_activity_action",
    "entity_type" "enum_activity_entity_type",
    "entity_id" UUID,
    "actor_id" UUID,
    "meta_data" JSONB DEFAULT '{}',
    "old_data" JSONB DEFAULT '{}',
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_note_reason" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_note_reason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cn_no" VARCHAR,
    "cn_date" TIMESTAMPTZ(6),
    "doc_status" "enum_credit_note_doc_status" NOT NULL DEFAULT 'draft',
    "credit_note_type" "enum_credit_note_type" NOT NULL,
    "vendor_id" UUID,
    "vendor_name" VARCHAR,
    "pricelist_detail_id" UUID,
    "pricelist_no" VARCHAR,
    "pricelist_unit" VARCHAR,
    "pricelist_price" DECIMAL(20,5) DEFAULT 0,
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "exchange_rate_date" TIMESTAMPTZ(6),
    "grn_id" UUID,
    "grn_no" VARCHAR,
    "grn_date" TIMESTAMPTZ(6),
    "cn_reason_id" UUID,
    "cn_reason_name" VARCHAR,
    "cn_reason_description" VARCHAR,
    "invoice_no" VARCHAR,
    "invoice_date" TIMESTAMPTZ(6),
    "tax_invoice_no" VARCHAR,
    "tax_invoice_date" TIMESTAMPTZ(6),
    "note" VARCHAR,
    "description" VARCHAR,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_note_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_note_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_note_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_note_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_note_id" UUID NOT NULL,
    "inventory_transaction_id" UUID,
    "sequence_no" INTEGER DEFAULT 1,
    "description" VARCHAR,
    "note" VARCHAR,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "delivery_point_id" UUID,
    "delivery_point_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "return_qty" DECIMAL(20,5) DEFAULT 0,
    "return_unit_id" UUID,
    "return_unit_name" VARCHAR,
    "return_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "return_base_qty" DECIMAL(20,5) DEFAULT 0,
    "price" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "base_tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "discount_rate" DECIMAL(15,5) DEFAULT 0,
    "discount_amount" DECIMAL(20,5) DEFAULT 0,
    "base_discount_amount" DECIMAL(20,5) DEFAULT 0,
    "is_discount_adjustment" BOOLEAN DEFAULT false,
    "extra_cost_amount" DECIMAL(20,5) DEFAULT 0,
    "base_extra_cost_amount" DECIMAL(20,5) DEFAULT 0,
    "sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "net_amount" DECIMAL(20,5) DEFAULT 0,
    "total_price" DECIMAL(20,5) DEFAULT 0,
    "base_price" DECIMAL(20,5) DEFAULT 0,
    "base_sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "base_net_amount" DECIMAL(20,5) DEFAULT 0,
    "base_total_price" DECIMAL(20,5) DEFAULT 0,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_note_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_note_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_note_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_note_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_currency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(5),
    "description" TEXT DEFAULT '',
    "decimal_places" INTEGER DEFAULT 2,
    "is_active" BOOLEAN DEFAULT true,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "exchange_rate_at" TIMESTAMPTZ(6),
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_currency_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_currency_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_delivery_point" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_delivery_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_delivery_point_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "delivery_point_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_delivery_point_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_department" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_department_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_department_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_exchange_rate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "at_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "currency_id" UUID,
    "currency_code" VARCHAR(3),
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_exchange_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_exchange_rate_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exchange_rate_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_exchange_rate_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_good_received_note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grn_no" VARCHAR,
    "grn_date" TIMESTAMPTZ(6),
    "invoice_no" VARCHAR,
    "invoice_date" TIMESTAMPTZ(6),
    "description" VARCHAR,
    "doc_status" "enum_good_received_note_status" NOT NULL DEFAULT 'draft',
    "doc_type" "enum_good_received_note_type" NOT NULL DEFAULT 'purchase_order',
    "vendor_id" UUID,
    "vendor_name" VARCHAR,
    "currency_id" UUID NOT NULL,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "exchange_rate_date" TIMESTAMPTZ(6),
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "is_consignment" BOOLEAN DEFAULT false,
    "is_cash" BOOLEAN DEFAULT false,
    "signature_image_url" VARCHAR,
    "received_by_id" UUID,
    "received_by_name" VARCHAR,
    "received_at" TIMESTAMPTZ(6),
    "credit_term_id" UUID,
    "credit_term_name" VARCHAR,
    "credit_term_days" INTEGER,
    "payment_due_date" TIMESTAMPTZ(6),
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_good_received_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_good_received_note_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "good_received_note_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_good_received_note_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_good_received_note_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "good_received_note_id" UUID NOT NULL,
    "sequence_no" INTEGER NOT NULL DEFAULT 1,
    "purchase_order_id" UUID,
    "purchase_order_detail_id" UUID,
    "location_id" UUID NOT NULL,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,

    CONSTRAINT "tb_good_received_note_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_good_received_note_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "good_received_note_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_good_received_note_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_good_received_note_detail_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "good_received_note_detail_id" UUID NOT NULL,
    "inventory_transaction_id" UUID,
    "purchase_order_detail_purchase_request_detail_id" UUID,
    "order_qty" DECIMAL(20,5) DEFAULT 0,
    "order_unit_id" UUID,
    "order_unit_name" VARCHAR,
    "order_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "order_base_qty" DECIMAL(20,5) DEFAULT 0,
    "received_qty" DECIMAL(20,5) DEFAULT 0,
    "received_unit_id" UUID,
    "received_unit_name" VARCHAR,
    "received_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "received_base_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_unit_id" UUID,
    "foc_unit_name" VARCHAR,
    "foc_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "foc_base_qty" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "base_tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "discount_rate" DECIMAL(15,5) DEFAULT 0,
    "discount_amount" DECIMAL(20,5) DEFAULT 0,
    "base_discount_amount" DECIMAL(20,5) DEFAULT 0,
    "is_discount_adjustment" BOOLEAN DEFAULT false,
    "sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "net_amount" DECIMAL(20,5) DEFAULT 0,
    "total_price" DECIMAL(20,5) DEFAULT 0,
    "base_price" DECIMAL(20,5) DEFAULT 0,
    "base_sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "base_net_amount" DECIMAL(20,5) DEFAULT 0,
    "base_total_price" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_good_received_note_detail_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_inventory_transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_doc_type" "enum_inventory_doc_type" NOT NULL,
    "inventory_doc_no" UUID NOT NULL,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_inventory_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_inventory_transaction_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_id" UUID NOT NULL,
    "from_lot_no" VARCHAR,
    "current_lot_no" VARCHAR,
    "location_id" UUID,
    "location_code" VARCHAR,
    "product_id" UUID NOT NULL,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "total_cost" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,

    CONSTRAINT "tb_inventory_transaction_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_inventory_transaction_cost_layer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_detail_id" UUID NOT NULL,
    "lot_no" VARCHAR,
    "lot_index" INTEGER NOT NULL DEFAULT 1,
    "location_id" UUID,
    "location_code" VARCHAR,
    "lot_at_date" TIMESTAMPTZ(6),
    "lot_seq_no" INTEGER DEFAULT 1,
    "product_id" UUID,
    "parent_lot_no" VARCHAR,
    "period_id" UUID,
    "at_period" VARCHAR,
    "transaction_type" "enum_transaction_type",
    "in_qty" DECIMAL(20,5) DEFAULT 0,
    "out_qty" DECIMAL(20,5) DEFAULT 0,
    "cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "total_cost" DECIMAL(20,5) DEFAULT 0,
    "diff_amount" DECIMAL(20,5) DEFAULT 0,
    "average_cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_inventory_transaction_cost_layer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_period" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period" VARCHAR NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "fiscal_month" INTEGER NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "enum_period_status" NOT NULL DEFAULT 'open',
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_period_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_period_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_period_snapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "snapshot_at" TIMESTAMPTZ(6) NOT NULL,
    "location_id" UUID NOT NULL,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "lot_no" VARCHAR,
    "lot_index" INTEGER DEFAULT 1,
    "lot_at_date" TIMESTAMPTZ(6),
    "lot_seq_no" INTEGER DEFAULT 1,
    "opening_qty" DECIMAL(20,5) DEFAULT 0,
    "opening_cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "opening_total_cost" DECIMAL(20,5) DEFAULT 0,
    "receipt_qty" DECIMAL(20,5) DEFAULT 0,
    "receipt_total_cost" DECIMAL(20,5) DEFAULT 0,
    "issue_qty" DECIMAL(20,5) DEFAULT 0,
    "issue_total_cost" DECIMAL(20,5) DEFAULT 0,
    "adjustment_qty" DECIMAL(20,5) DEFAULT 0,
    "adjustment_total_cost" DECIMAL(20,5) DEFAULT 0,
    "closing_qty" DECIMAL(20,5) DEFAULT 0,
    "closing_cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "closing_total_cost" DECIMAL(20,5) DEFAULT 0,
    "diff_amount" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_period_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "location_type" "enum_location_type" NOT NULL DEFAULT 'inventory',
    "description" TEXT,
    "delivery_point_id" UUID,
    "delivery_point_name" VARCHAR,
    "physical_count_type" "enum_physical_count_type" NOT NULL DEFAULT 'no',
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_location_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_location_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_menu" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "url" VARCHAR NOT NULL,
    "description" TEXT,
    "is_visible" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "is_lock" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_tax_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_tax_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_tax_profile_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tax_profile_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_tax_profile_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "local_name" VARCHAR,
    "description" VARCHAR,
    "inventory_unit_id" UUID NOT NULL,
    "inventory_unit_name" VARCHAR NOT NULL DEFAULT '',
    "product_status_type" "enum_product_status_type" NOT NULL DEFAULT 'active',
    "product_item_group_id" UUID,
    "is_used_in_recipe" BOOLEAN DEFAULT true,
    "is_sold_directly" BOOLEAN DEFAULT false,
    "barcode" VARCHAR,
    "sku" VARCHAR,
    "price_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "qty_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "certification" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "price_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "qty_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "is_used_in_recipe" BOOLEAN DEFAULT true,
    "is_sold_directly" BOOLEAN DEFAULT false,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_category_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_category_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_category_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_item_group" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_subcategory_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "price_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "qty_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "is_used_in_recipe" BOOLEAN DEFAULT true,
    "is_sold_directly" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_item_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_item_group_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_item_group_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_item_group_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_sub_category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_category_id" UUID NOT NULL,
    "code" VARCHAR NOT NULL DEFAULT '',
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "price_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "qty_deviation_limit" DECIMAL(20,5) DEFAULT 0,
    "is_used_in_recipe" BOOLEAN DEFAULT true,
    "is_sold_directly" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_sub_category_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_sub_category_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_sub_category_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_tb_vendor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "vendor_id" UUID,
    "vendor_product_code" VARCHAR,
    "vendor_product_name" VARCHAR,
    "description" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_tb_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_no" VARCHAR NOT NULL,
    "po_status" "enum_purchase_order_doc_status" DEFAULT 'draft',
    "description" TEXT,
    "order_date" TIMESTAMPTZ(6),
    "delivery_date" TIMESTAMPTZ(6),
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '[]',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "vendor_id" UUID,
    "vendor_name" VARCHAR,
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "approval_date" TIMESTAMPTZ(6),
    "email" VARCHAR,
    "buyer_id" UUID,
    "buyer_name" VARCHAR,
    "credit_term_id" UUID,
    "credit_term_name" VARCHAR,
    "credit_term_value" INTEGER DEFAULT 0,
    "remarks" VARCHAR,
    "history" JSONB DEFAULT '[]',
    "total_qty" DECIMAL(20,5) DEFAULT 0,
    "total_price" DECIMAL(20,5) DEFAULT 0,
    "total_tax" DECIMAL(20,5) DEFAULT 0,
    "total_amount" DECIMAL(20,5) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_order_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_order_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_order_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID,
    "description" TEXT,
    "sequence_no" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,
    "order_qty" DECIMAL(20,5) DEFAULT 0,
    "order_unit_id" UUID,
    "order_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "order_unit_name" VARCHAR,
    "base_qty" DECIMAL(20,5) DEFAULT 0,
    "base_unit_id" UUID,
    "base_unit_name" VARCHAR,
    "is_foc" BOOLEAN DEFAULT false,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "base_tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "discount_rate" DECIMAL(15,5) DEFAULT 0,
    "discount_amount" DECIMAL(20,5) DEFAULT 0,
    "base_discount_amount" DECIMAL(20,5) DEFAULT 0,
    "is_discount_adjustment" BOOLEAN DEFAULT false,
    "price" DECIMAL(20,5) DEFAULT 0,
    "sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "net_amount" DECIMAL(20,5) DEFAULT 0,
    "total_price" DECIMAL(20,5) DEFAULT 0,
    "base_price" DECIMAL(20,5) DEFAULT 0,
    "base_sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "base_net_amount" DECIMAL(20,5) DEFAULT 0,
    "base_total_price" DECIMAL(20,5) DEFAULT 0,
    "received_qty" DECIMAL(20,5) DEFAULT 0,
    "cancelled_qty" DECIMAL(20,5) DEFAULT 0,
    "history" JSONB DEFAULT '[]',
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_order_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_order_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_order_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_order_detail_tb_purchase_request_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_detail_id" UUID NOT NULL,
    "pr_detail_id" UUID NOT NULL,
    "pr_detail_order_unit_id" UUID NOT NULL,
    "pr_detail_order_unit_name" VARCHAR NOT NULL,
    "pr_detail_qty" DECIMAL(20,5) DEFAULT 0,
    "received_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_qty" DECIMAL(20,5) DEFAULT 0,
    "pr_detail_base_qty" DECIMAL(20,5) DEFAULT 0,
    "pr_detail_base_unit_id" UUID,
    "pr_detail_base_unit_name" VARCHAR,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_order_detail_tb_purchase_request_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pr_no" VARCHAR NOT NULL,
    "pr_date" TIMESTAMPTZ(6),
    "description" VARCHAR,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '[]',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "pr_status" "enum_purchase_request_doc_status" DEFAULT 'draft',
    "requestor_id" UUID,
    "requestor_name" VARCHAR,
    "department_id" UUID,
    "department_name" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_id" UUID,
    "sequence_no" INTEGER DEFAULT 1,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "delivery_point_id" UUID,
    "delivery_point_name" VARCHAR,
    "delivery_date" TIMESTAMPTZ(6),
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "inventory_unit_id" UUID,
    "inventory_unit_name" VARCHAR,
    "description" VARCHAR,
    "comment" VARCHAR,
    "vendor_id" UUID,
    "vendor_name" VARCHAR,
    "pricelist_detail_id" UUID,
    "pricelist_no" VARCHAR,
    "pricelist_unit" VARCHAR,
    "pricelist_price" DECIMAL(20,5) DEFAULT 0,
    "pricelist_type" "enum_pricelist_compare_type" DEFAULT 'automatic',
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "exchange_rate_date" TIMESTAMPTZ(6),
    "requested_qty" DECIMAL(20,5) DEFAULT 0,
    "requested_unit_id" UUID,
    "requested_unit_name" VARCHAR,
    "requested_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "requested_base_qty" DECIMAL(20,5) DEFAULT 0,
    "approved_qty" DECIMAL(20,5) DEFAULT 0,
    "approved_unit_id" UUID,
    "approved_unit_name" VARCHAR,
    "approved_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "approved_base_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_unit_id" UUID,
    "foc_unit_name" VARCHAR,
    "foc_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "foc_base_qty" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "base_tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "discount_rate" DECIMAL(15,5) DEFAULT 0,
    "discount_amount" DECIMAL(20,5) DEFAULT 0,
    "base_discount_amount" DECIMAL(20,5) DEFAULT 0,
    "is_discount_adjustment" BOOLEAN DEFAULT false,
    "sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "net_amount" DECIMAL(20,5) DEFAULT 0,
    "total_price" DECIMAL(20,5) DEFAULT 0,
    "base_price" DECIMAL(20,5) DEFAULT 0,
    "base_sub_total_price" DECIMAL(20,5) DEFAULT 0,
    "base_net_amount" DECIMAL(20,5) DEFAULT 0,
    "base_total_price" DECIMAL(20,5) DEFAULT 0,
    "history" JSONB DEFAULT '[]',
    "stages_status" JSONB DEFAULT '{}',
    "current_stage_status" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "department_id" UUID,
    "department_name" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_template_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_template_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_template_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_purchase_request_template_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_request_template_id" UUID,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "delivery_point_id" UUID,
    "delivery_point_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "inventory_unit_id" UUID,
    "inventory_unit_name" VARCHAR,
    "description" VARCHAR,
    "comment" VARCHAR,
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "exchange_rate_date" TIMESTAMPTZ(6),
    "requested_qty" DECIMAL(20,5) DEFAULT 0,
    "requested_unit_id" UUID,
    "requested_unit_name" VARCHAR,
    "requested_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "requested_base_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_qty" DECIMAL(20,5) DEFAULT 0,
    "foc_unit_id" UUID,
    "foc_unit_name" VARCHAR,
    "foc_unit_conversion_factor" DECIMAL(20,5) DEFAULT 0,
    "foc_base_qty" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "base_tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "discount_rate" DECIMAL(15,5) DEFAULT 0,
    "discount_amount" DECIMAL(20,5) DEFAULT 0,
    "base_discount_amount" DECIMAL(20,5) DEFAULT 0,
    "is_discount_adjustment" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_purchase_request_template_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_in" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "si_no" VARCHAR,
    "description" VARCHAR,
    "doc_status" "enum_doc_status" NOT NULL DEFAULT 'draft',
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_in_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stock_in_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_in_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_in_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_id" UUID,
    "stock_in_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "description" VARCHAR,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "total_cost" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_in_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_in_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stock_in_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_in_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_out" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "so_no" VARCHAR,
    "description" VARCHAR,
    "doc_status" "enum_doc_status" NOT NULL DEFAULT 'draft',
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_out_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_out_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stock_out_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_out_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_out_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_id" UUID,
    "stock_out_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "description" VARCHAR,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_out_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_stock_out_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stock_out_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_stock_out_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_store_requisition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sr_no" VARCHAR NOT NULL,
    "sr_date" TIMESTAMPTZ(6),
    "expected_date" TIMESTAMPTZ(6),
    "description" VARCHAR,
    "doc_status" "enum_doc_status" NOT NULL DEFAULT 'draft',
    "from_location_id" UUID,
    "from_location_code" VARCHAR,
    "from_location_name" VARCHAR,
    "to_location_id" UUID,
    "to_location_code" VARCHAR,
    "to_location_name" VARCHAR,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "requestor_id" UUID,
    "requestor_name" VARCHAR,
    "department_id" UUID,
    "department_name" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tb_store_requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_store_requisition_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_requisition_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_store_requisition_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_store_requisition_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_id" UUID,
    "store_requisition_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "description" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "requested_qty" DECIMAL(20,5) DEFAULT 0,
    "approved_qty" DECIMAL(20,5) DEFAULT 0,
    "issued_qty" DECIMAL(20,5) DEFAULT 0,
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "approved_message" VARCHAR,
    "approved_by_id" UUID,
    "approved_by_name" VARCHAR,
    "approved_date_at" TIMESTAMPTZ(6),
    "review_message" VARCHAR,
    "review_by_id" UUID,
    "review_by_name" VARCHAR,
    "review_date_at" TIMESTAMPTZ(6),
    "reject_message" VARCHAR,
    "reject_by_id" UUID,
    "reject_by_name" VARCHAR,
    "reject_date_at" TIMESTAMPTZ(6),
    "history" JSONB DEFAULT '[]',
    "stages_status" JSONB DEFAULT '{}',
    "current_stage_status" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_store_requisition_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_store_requisition_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "store_requisition_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_store_requisition_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_unit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_unit_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unit_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_unit_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_unit_conversion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID,
    "unit_type" "enum_unit_type" NOT NULL,
    "from_unit_id" UUID,
    "from_unit_name" VARCHAR NOT NULL,
    "from_unit_qty" DECIMAL(20,5) DEFAULT 0,
    "to_unit_id" UUID,
    "to_unit_name" VARCHAR NOT NULL,
    "to_unit_qty" DECIMAL(20,5) DEFAULT 0,
    "is_default" BOOLEAN DEFAULT false,
    "description" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_unit_conversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "note" VARCHAR,
    "business_type" JSONB DEFAULT '[]',
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor_address" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID,
    "address_type" "enum_vendor_address_type",
    "data" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor_contact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_id" UUID,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR,
    "phone" VARCHAR,
    "is_primary" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_workflow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "workflow_type" "enum_workflow_type" NOT NULL,
    "data" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_workflow_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflow_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_workflow_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_count_stock" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "count_stock_no" VARCHAR,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "location_id" UUID NOT NULL,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "doc_status" "enum_count_stock_status" NOT NULL DEFAULT 'pending',
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_count_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_count_stock_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "count_stock_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_count_stock_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_count_stock_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "count_stock_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_count_stock_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_count_stock_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "count_stock_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_count_stock_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_spot_check" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spot_check_no" VARCHAR,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "location_id" UUID NOT NULL,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "doc_status" "enum_spot_check_status" NOT NULL DEFAULT 'pending',
    "method" "enum_spot_check_method" NOT NULL DEFAULT 'random',
    "size" INTEGER NOT NULL DEFAULT 10,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_spot_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_spot_check_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spot_check_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_spot_check_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_spot_check_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spot_check_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_spot_check_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_spot_check_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spot_check_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_spot_check_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_jv_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jv_header_id" UUID NOT NULL,
    "account_code" VARCHAR,
    "account_name" VARCHAR,
    "sequence_no" INTEGER DEFAULT 1,
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "debit" DECIMAL(20,5) DEFAULT 0,
    "credit" DECIMAL(20,5) DEFAULT 0,
    "base_currency_id" UUID,
    "base_currency_name" VARCHAR,
    "base_debit" DECIMAL(20,5) DEFAULT 0,
    "base_credit" DECIMAL(20,5) DEFAULT 0,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_jv_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_jv_header" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "exchange_rate" DECIMAL(15,5) DEFAULT 1,
    "base_currency_id" UUID,
    "base_currency_name" VARCHAR,
    "jv_type" VARCHAR(255) NOT NULL,
    "jv_no" VARCHAR(255) NOT NULL,
    "jv_date" TIMESTAMPTZ(6) NOT NULL,
    "description" VARCHAR,
    "note" VARCHAR,
    "jv_status" "enum_jv_status" NOT NULL,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_jv_header_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "status" "enum_pricelist_template_status" NOT NULL DEFAULT 'draft',
    "description" VARCHAR,
    "note" VARCHAR,
    "vendor_instructions" TEXT,
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "validity_period" INTEGER,
    "send_reminders" BOOLEAN DEFAULT true,
    "reminder_days" JSONB DEFAULT '[]',
    "escalation_after_days" INTEGER DEFAULT 0,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_template_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_template_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_template_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_template_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_template_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "inventory_unit_id" UUID,
    "inventory_unit_name" VARCHAR,
    "order_unit_obj" JSONB DEFAULT '{}',
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_template_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_template_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_template_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_template_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_request_for_pricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "pricelist_template_id" UUID NOT NULL,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "custom_message" TEXT,
    "email_template_id" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_request_for_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_request_for_pricing_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_for_pricing_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_request_for_pricing_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_request_for_pricing_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_for_pricing_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "vendor_id" UUID NOT NULL,
    "vendor_name" VARCHAR,
    "contact_person" VARCHAR,
    "contact_phone" VARCHAR,
    "contact_email" VARCHAR,
    "pricelist_id" UUID,
    "pricelist_no" VARCHAR,
    "pricelist_url_token" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_request_for_pricing_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_request_for_pricing_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_for_pricing_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_request_for_pricing_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_no" VARCHAR NOT NULL,
    "name" VARCHAR,
    "status" "enum_pricelist_status" NOT NULL DEFAULT 'draft',
    "url_token" VARCHAR,
    "vendor_id" UUID,
    "vendor_name" VARCHAR,
    "effective_from_date" TIMESTAMPTZ(6),
    "effective_to_date" TIMESTAMPTZ(6),
    "currency_id" UUID,
    "currency_name" VARCHAR,
    "submission_method" "pricelist_submission_method" DEFAULT 'online',
    "submitted_at" TIMESTAMPTZ(6),
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "unit_id" UUID,
    "unit_name" VARCHAR,
    "is_preferred" BOOLEAN DEFAULT false,
    "rating" INTEGER DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "moq_qty" DECIMAL(20,5) DEFAULT 0,
    "price_without_tax" DECIMAL(20,5) DEFAULT 0,
    "tax_amt" DECIMAL(20,5) DEFAULT 0,
    "price" DECIMAL(20,5) DEFAULT 0,
    "lead_time_days" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_pricelist_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricelist_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_pricelist_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_product_location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "location_id" UUID,
    "location_code" VARCHAR,
    "location_name" VARCHAR,
    "min_qty" DECIMAL(20,5) DEFAULT 0,
    "max_qty" DECIMAL(20,5) DEFAULT 0,
    "re_order_qty" DECIMAL(20,5) DEFAULT 0,
    "par_qty" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_product_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_department_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "is_hod" BOOLEAN DEFAULT false,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_department_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s3_token" VARCHAR(255),
    "s3_folder" VARCHAR(255),
    "file_name" VARCHAR(255),
    "file_ext" VARCHAR(255),
    "file_type" VARCHAR(255),
    "file_size" BIGINT,
    "file_url" VARCHAR(255),
    "info" JSON,
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_user_location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_user_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_user_profile" (
    "user_id" UUID NOT NULL,
    "firstname" VARCHAR(100) NOT NULL DEFAULT '',
    "middlename" VARCHAR(100) DEFAULT '',
    "lastname" VARCHAR(100) DEFAULT '',
    "telephone" VARCHAR(50) DEFAULT '',
    "bio" JSONB DEFAULT '{}',
    "info" JSONB DEFAULT '{}',

    CONSTRAINT "tb_user_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "tb_config_running_code" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(255),
    "config" JSONB DEFAULT '{}',
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_config_running_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_config_running_code_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "config_running_code_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_config_running_code_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_term" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "value" INTEGER DEFAULT 0,
    "description" VARCHAR,
    "note" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_credit_term_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "credit_term_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_credit_term_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_dimension" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR NOT NULL,
    "type" "enum_dimension_type" NOT NULL DEFAULT 'string',
    "value" JSONB DEFAULT '{}',
    "description" VARCHAR,
    "note" VARCHAR,
    "default_value" JSONB DEFAULT '{}',
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_dimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_dimension_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dimension_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_dimension_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_dimension_display_in" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dimension_id" UUID NOT NULL,
    "display_in" "enum_dimension_display_in" NOT NULL,
    "default_value" JSONB DEFAULT '{}',
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_dimension_display_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_extra_cost" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR,
    "good_received_note_id" UUID,
    "allocate_extra_cost_type" "enum_allocate_extra_cost_type",
    "description" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_extra_cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_extra_cost_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extra_cost_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_extra_cost_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_extra_cost_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extra_cost_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "extra_cost_type_id" UUID NOT NULL,
    "name" VARCHAR,
    "description" VARCHAR,
    "note" VARCHAR,
    "amount" DECIMAL(20,5) DEFAULT 0,
    "tax_profile_id" UUID,
    "tax_profile_name" VARCHAR,
    "tax_rate" DECIMAL(15,5) DEFAULT 0,
    "tax_amount" DECIMAL(20,5) DEFAULT 0,
    "is_tax_adjustment" BOOLEAN DEFAULT false,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_extra_cost_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_extra_cost_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extra_cost_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_extra_cost_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_extra_cost_type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR,
    "description" VARCHAR,
    "note" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_extra_cost_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor_business_type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "note" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '{}',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_business_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_vendor_business_type_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendor_business_type_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_vendor_business_type_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_application_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_application_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_application_user_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "key" VARCHAR NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_application_user_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_entitytype_entityid_idx" ON "tb_activity"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "creditnotereason_name_idx" ON "tb_credit_note_reason"("name");

-- CreateIndex
CREATE UNIQUE INDEX "creditnotereason_name_u" ON "tb_credit_note_reason"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "creditnote_cn_no_idx" ON "tb_credit_note"("cn_no");

-- CreateIndex
CREATE UNIQUE INDEX "creditnote_cn_no_u" ON "tb_credit_note"("cn_no", "deleted_at");

-- CreateIndex
CREATE INDEX "creditnotedetail_credit_note_id_sequence_no_idx" ON "tb_credit_note_detail"("credit_note_id", "sequence_no");

-- CreateIndex
CREATE UNIQUE INDEX "creditnotedetail_credit_note_id_sequence_no_u" ON "tb_credit_note_detail"("credit_note_id", "sequence_no", "deleted_at");

-- CreateIndex
CREATE INDEX "currency_code_idx" ON "tb_currency"("code");

-- CreateIndex
CREATE INDEX "currency_name_idx" ON "tb_currency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "currency_code_u" ON "tb_currency"("code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "currency_name_u" ON "tb_currency"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "currency_code_name_u" ON "tb_currency"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "deliverypoint_name_idx" ON "tb_delivery_point"("name");

-- CreateIndex
CREATE UNIQUE INDEX "deliverypoint_name_u" ON "tb_delivery_point"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "department_name_idx" ON "tb_department"("name");

-- CreateIndex
CREATE INDEX "department_code_idx" ON "tb_department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "department_name_u" ON "tb_department"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_u" ON "tb_department"("code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "department_code_name_u" ON "tb_department"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "exchangerate_at_date_currency_idx" ON "tb_exchange_rate"("at_date", "currency_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchangerate_at_date_currency_u" ON "tb_exchange_rate"("at_date", "currency_id", "deleted_at");

-- CreateIndex
CREATE INDEX "goodreceivednote_grn_no_idx" ON "tb_good_received_note"("grn_no");

-- CreateIndex
CREATE UNIQUE INDEX "goodreceivednote_grn_no_u" ON "tb_good_received_note"("grn_no", "deleted_at");

-- CreateIndex
CREATE INDEX "goodreceivednotedetail_good_received_note_id_sequence_no_idx" ON "tb_good_received_note_detail"("good_received_note_id", "sequence_no");

-- CreateIndex
CREATE UNIQUE INDEX "goodreceivednotedetail_good_received_note_id_sequence_no_u" ON "tb_good_received_note_detail"("good_received_note_id", "sequence_no");

-- CreateIndex
CREATE INDEX "inventorytransaction_inventory_doc_no_idx" ON "tb_inventory_transaction"("inventory_doc_no");

-- CreateIndex
CREATE INDEX "inventorytransaction_inventory_doc_type_idx" ON "tb_inventory_transaction"("inventory_doc_type");

-- CreateIndex
CREATE INDEX "inventorytransaction_inventory_doc_type_inventory_doc_no_idx" ON "tb_inventory_transaction"("inventory_doc_type", "inventory_doc_no");

-- CreateIndex
CREATE INDEX "inventorytransactiondetail_inventory_transaction_id_idx" ON "tb_inventory_transaction_detail"("inventory_transaction_id");

-- CreateIndex
CREATE INDEX "inventorytransactioncostlayer_lotno_lot_index_idx" ON "tb_inventory_transaction_cost_layer"("lot_no", "lot_index");

-- CreateIndex
CREATE UNIQUE INDEX "inventorytransactionclosingbalance_lotno_lot_index_u" ON "tb_inventory_transaction_cost_layer"("lot_no", "lot_index");

-- CreateIndex
CREATE INDEX "period_fiscal_year_month_idx" ON "tb_period"("fiscal_year", "fiscal_month");

-- CreateIndex
CREATE INDEX "period_period_idx" ON "tb_period"("period");

-- CreateIndex
CREATE UNIQUE INDEX "period_period_u" ON "tb_period"("period", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "period_fiscal_year_month_u" ON "tb_period"("fiscal_year", "fiscal_month", "deleted_at");

-- CreateIndex
CREATE INDEX "periodsnapshot_period_id_snapshot_at_idx" ON "tb_period_snapshot"("period_id", "snapshot_at");

-- CreateIndex
CREATE UNIQUE INDEX "periodsnapshot_period_id_snapshot_at_u" ON "tb_period_snapshot"("period_id", "snapshot_at", "deleted_at");

-- CreateIndex
CREATE INDEX "location_name_idx" ON "tb_location"("name");

-- CreateIndex
CREATE INDEX "location_code_idx" ON "tb_location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "location_code_name_u" ON "tb_location"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "menu_name_idx" ON "tb_menu"("name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_module_id_name_u" ON "tb_menu"("module_id", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "taxprofile_name_idx" ON "tb_tax_profile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "taxprofile_name_deletedat_u" ON "tb_tax_profile"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "product_code_idx" ON "tb_product"("code");

-- CreateIndex
CREATE INDEX "product_name_idx" ON "tb_product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_code_name_u" ON "tb_product"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "productcategory_code_idx" ON "tb_product_category"("code");

-- CreateIndex
CREATE INDEX "productcategory_name_idx" ON "tb_product_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "productcategory_code_name_u" ON "tb_product_category"("code", "name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "productcategory_code_u" ON "tb_product_category"("code", "deleted_at");

-- CreateIndex
CREATE INDEX "productitemgroup_code_idx" ON "tb_product_item_group"("code");

-- CreateIndex
CREATE INDEX "productitemgroup_name_idx" ON "tb_product_item_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "productitemgroup_code_name_product_subcategory_u" ON "tb_product_item_group"("code", "name", "product_subcategory_id", "deleted_at");

-- CreateIndex
CREATE INDEX "productsubcategory_code_idx" ON "tb_product_sub_category"("code");

-- CreateIndex
CREATE INDEX "productsubcategory_name_idx" ON "tb_product_sub_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "productsubcategory_code_name_u" ON "tb_product_sub_category"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "product_vendor_product_id_idx" ON "tb_product_tb_vendor"("product_id");

-- CreateIndex
CREATE INDEX "product_vendor_vendor_id_idx" ON "tb_product_tb_vendor"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_vendor_vendor_product_u" ON "tb_product_tb_vendor"("vendor_id", "product_id", "deleted_at");

-- CreateIndex
CREATE INDEX "PO_po_no_idx" ON "tb_purchase_order"("po_no");

-- CreateIndex
CREATE INDEX "PO_vendor_id_idx" ON "tb_purchase_order"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "PO_po_no_u" ON "tb_purchase_order"("po_no", "deleted_at");

-- CreateIndex
CREATE INDEX "PO1_purchase_order_detail_idx" ON "tb_purchase_order_detail"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "PO1_purchase_order_detail_sequence_no_u" ON "tb_purchase_order_detail"("purchase_order_id", "sequence_no", "deleted_at");

-- CreateIndex
CREATE INDEX "PO1_purchase_order_purchase_request_detail_idx" ON "tb_purchase_order_detail_tb_purchase_request_detail"("po_detail_id", "pr_detail_id");

-- CreateIndex
CREATE INDEX "PO1_purchase_request_detail_idx" ON "tb_purchase_order_detail_tb_purchase_request_detail"("pr_detail_id");

-- CreateIndex
CREATE UNIQUE INDEX "PO1_purchase_order_purchase_request_detail_u" ON "tb_purchase_order_detail_tb_purchase_request_detail"("po_detail_id", "pr_detail_id", "deleted_at");

-- CreateIndex
CREATE INDEX "PR0_pr_no_idx" ON "tb_purchase_request"("pr_no");

-- CreateIndex
CREATE INDEX "PR0_requestor_id_idx" ON "tb_purchase_request"("requestor_id");

-- CreateIndex
CREATE UNIQUE INDEX "PR0_pr_no_u" ON "tb_purchase_request"("pr_no", "deleted_at");

-- CreateIndex
CREATE INDEX "PRD1_product_id_idx" ON "tb_purchase_request_detail"("product_id");

-- CreateIndex
CREATE INDEX "PRD1_location_id_idx" ON "tb_purchase_request_detail"("location_id");

-- CreateIndex
CREATE INDEX "PRD1_location_product_idx" ON "tb_purchase_request_detail"("location_id", "product_id");

-- CreateIndex
CREATE INDEX "PRD1_purchase_request_id_idx" ON "tb_purchase_request_detail"("purchase_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "PR1_purchase_request_product_location_dimension_u" ON "tb_purchase_request_detail"("purchase_request_id", "product_id", "location_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "PRT1_workflow_id_idx" ON "tb_purchase_request_template"("workflow_id");

-- CreateIndex
CREATE INDEX "PRT1_name_idx" ON "tb_purchase_request_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PRT1_name_workflow_id_u" ON "tb_purchase_request_template"("name", "workflow_id", "deleted_at");

-- CreateIndex
CREATE INDEX "PRT2_purchase_request_template_product_location_idx" ON "tb_purchase_request_template_detail"("purchase_request_template_id", "product_id", "location_id");

-- CreateIndex
CREATE INDEX "PRT2_purchase_request_template_idx" ON "tb_purchase_request_template_detail"("purchase_request_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "PRT1_purchase_request_template_product_location_dimension_u" ON "tb_purchase_request_template_detail"("purchase_request_template_id", "product_id", "location_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "SI0_si_no_idx" ON "tb_stock_in"("si_no");

-- CreateIndex
CREATE UNIQUE INDEX "SI1_si_no_u" ON "tb_stock_in"("si_no", "deleted_at");

-- CreateIndex
CREATE INDEX "SIT2_stock_in_product_location_idx" ON "tb_stock_in_detail"("stock_in_id", "product_id", "location_id");

-- CreateIndex
CREATE INDEX "SIT2_stock_in_idx" ON "tb_stock_in_detail"("stock_in_id");

-- CreateIndex
CREATE UNIQUE INDEX "SIT1_stock_in_product_location_dimension_u" ON "tb_stock_in_detail"("stock_in_id", "product_id", "location_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "SO0_so_no_idx" ON "tb_stock_out"("so_no");

-- CreateIndex
CREATE UNIQUE INDEX "SO1_so_no_u" ON "tb_stock_out"("so_no", "deleted_at");

-- CreateIndex
CREATE INDEX "SOT2_stock_out_product_location_idx" ON "tb_stock_out_detail"("stock_out_id", "product_id", "location_id");

-- CreateIndex
CREATE INDEX "SOT2_stock_out_idx" ON "tb_stock_out_detail"("stock_out_id");

-- CreateIndex
CREATE UNIQUE INDEX "SOT1_stock_out_product_location_dimension_u" ON "tb_stock_out_detail"("stock_out_id", "product_id", "location_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "sr_no_idx" ON "tb_store_requisition"("sr_no");

-- CreateIndex
CREATE UNIQUE INDEX "sr_no_u" ON "tb_store_requisition"("sr_no", "deleted_at");

-- CreateIndex
CREATE INDEX "SRT2_store_requisition_product_location_idx" ON "tb_store_requisition_detail"("store_requisition_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "SRT1_store_requisition_product_location_dimension_u" ON "tb_store_requisition_detail"("store_requisition_id", "product_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "unit_name_idx" ON "tb_unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unit_name_deletedat_u" ON "tb_unit"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "unitconversion_product_unit_type_from_unit_to_unit_idx" ON "tb_unit_conversion"("product_id", "unit_type", "from_unit_id", "to_unit_id");

-- CreateIndex
CREATE INDEX "unitconversion_product_idx" ON "tb_unit_conversion"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "unitconversion_product_unit_type_from_unit_to_unit_deletedat_u" ON "tb_unit_conversion"("product_id", "unit_type", "from_unit_id", "to_unit_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vendor_code_idx" ON "tb_vendor"("code");

-- CreateIndex
CREATE INDEX "vendor_name_idx" ON "tb_vendor"("name");

-- CreateIndex
CREATE INDEX "vendor_code_name_idx" ON "tb_vendor"("code", "name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_code_name_u" ON "tb_vendor"("code", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "vendoraddress_vendor_address_type_idx" ON "tb_vendor_address"("vendor_id", "address_type");

-- CreateIndex
CREATE INDEX "vendoraddress_vendor_idx" ON "tb_vendor_address"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendoraddress_vendor_address_type_deletedat_u" ON "tb_vendor_address"("vendor_id", "address_type", "deleted_at");

-- CreateIndex
CREATE INDEX "vendorcontact_vendor_name_idx" ON "tb_vendor_contact"("vendor_id", "name");

-- CreateIndex
CREATE INDEX "vendorcontact_vendor_idx" ON "tb_vendor_contact"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendorcontact_vendor_name_deletedat_u" ON "tb_vendor_contact"("vendor_id", "name", "deleted_at");

-- CreateIndex
CREATE INDEX "workflow_name_workflow_type_idx" ON "tb_workflow"("name", "workflow_type");

-- CreateIndex
CREATE INDEX "workflow_name_idx" ON "tb_workflow"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_name_workflow_type_deletedat_u" ON "tb_workflow"("name", "workflow_type", "deleted_at");

-- CreateIndex
CREATE INDEX "CS0_count_stock_no_idx" ON "tb_count_stock"("count_stock_no");

-- CreateIndex
CREATE UNIQUE INDEX "CS1_count_stock_no_u" ON "tb_count_stock"("count_stock_no", "deleted_at");

-- CreateIndex
CREATE INDEX "CSD2_count_stock_product_idx" ON "tb_count_stock_detail"("count_stock_id", "product_id");

-- CreateIndex
CREATE INDEX "CSD2_count_stock_idx" ON "tb_count_stock_detail"("count_stock_id");

-- CreateIndex
CREATE INDEX "CSD2_product_idx" ON "tb_count_stock_detail"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "CSD1_count_stock_product_dimension_u" ON "tb_count_stock_detail"("count_stock_id", "product_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "SC0_spot_check_no_idx" ON "tb_spot_check"("spot_check_no");

-- CreateIndex
CREATE UNIQUE INDEX "SC1_spot_check_no_u" ON "tb_spot_check"("spot_check_no", "deleted_at");

-- CreateIndex
CREATE INDEX "SCD2_spot_check_product_idx" ON "tb_spot_check_detail"("spot_check_id", "product_id");

-- CreateIndex
CREATE INDEX "SCD2_spot_check_idx" ON "tb_spot_check_detail"("spot_check_id");

-- CreateIndex
CREATE INDEX "SCD2_product_idx" ON "tb_spot_check_detail"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "SCD1_spot_check_product_dimension_u" ON "tb_spot_check_detail"("spot_check_id", "product_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "jvdetail_jv_header_id_idx" ON "tb_jv_detail"("jv_header_id");

-- CreateIndex
CREATE UNIQUE INDEX "jvdetail_jvheader_accountcode_dimension_u" ON "tb_jv_detail"("jv_header_id", "account_code", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "jv_header_jv_no_idx" ON "tb_jv_header"("jv_no");

-- CreateIndex
CREATE UNIQUE INDEX "jv_header_jv_no_jv_date_u" ON "tb_jv_header"("jv_no", "jv_date", "deleted_at");

-- CreateIndex
CREATE INDEX "pricelist_template_name_idx" ON "tb_pricelist_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pricelist_template_name_deletedat_u" ON "tb_pricelist_template"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "pricelist_template_detail_pricelist_template_id_product_id_idx" ON "tb_pricelist_template_detail"("pricelist_template_id", "product_id");

-- CreateIndex
CREATE INDEX "pricelist_template_detail_product_id_idx" ON "tb_pricelist_template_detail"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "pricelist_template_detail_pricelist_template_id_product_id_u" ON "tb_pricelist_template_detail"("pricelist_template_id", "product_id", "deleted_at");

-- CreateIndex
CREATE INDEX "request_for_pricing_pricelist_template_id_idx" ON "tb_request_for_pricing"("pricelist_template_id");

-- CreateIndex
CREATE INDEX "request_for_pricing_name_idx" ON "tb_request_for_pricing"("name");

-- CreateIndex
CREATE UNIQUE INDEX "request_for_pricing_name_u" ON "tb_request_for_pricing"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "request_for_pricing_detail_request_for_pricing_id_vendor_id_idx" ON "tb_request_for_pricing_detail"("request_for_pricing_id", "vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_for_pricing_detail_request_for_pricing_id_vendor_id_u" ON "tb_request_for_pricing_detail"("request_for_pricing_id", "vendor_id", "deleted_at");

-- CreateIndex
CREATE INDEX "pricelist_name_idx" ON "tb_pricelist"("name");

-- CreateIndex
CREATE INDEX "pricelist_pricelist_no_idx" ON "tb_pricelist"("pricelist_no");

-- CreateIndex
CREATE UNIQUE INDEX "pricelist_pricelist_no_u" ON "tb_pricelist"("pricelist_no", "deleted_at");

-- CreateIndex
CREATE INDEX "pricelist_detail_pricelist_id_product_id_idx" ON "tb_pricelist_detail"("pricelist_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "pricelist_detail_pricelist_id_product_id_unit_id_moqqty_u" ON "tb_pricelist_detail"("pricelist_id", "product_id", "unit_id", "moq_qty", "deleted_at");

-- CreateIndex
CREATE INDEX "product_location_product_id_location_id_idx" ON "tb_product_location"("product_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_location_product_id_location_id_u" ON "tb_product_location"("product_id", "location_id", "deleted_at");

-- CreateIndex
CREATE INDEX "department_user_department_id_user_id_idx" ON "tb_department_user"("department_id", "user_id");

-- CreateIndex
CREATE INDEX "department_user_user_id_idx" ON "tb_department_user"("user_id");

-- CreateIndex
CREATE INDEX "department_user_department_id_idx" ON "tb_department_user"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_user_u" ON "tb_department_user"("department_id", "user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "attachment_s3_token_idx" ON "tb_attachment"("s3_token");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_s3_token_u" ON "tb_attachment"("s3_token", "deleted_at");

-- CreateIndex
CREATE INDEX "user_location_user_id_location_id_idx" ON "tb_user_location"("user_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_location_user_id_location_id_u" ON "tb_user_location"("user_id", "location_id", "deleted_at");

-- CreateIndex
CREATE INDEX "user_profile_user_id_idx" ON "tb_user_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_user_id_u" ON "tb_user_profile"("user_id");

-- CreateIndex
CREATE INDEX "config_running_code_type_idx" ON "tb_config_running_code"("type");

-- CreateIndex
CREATE UNIQUE INDEX "config_running_code_type_u" ON "tb_config_running_code"("type", "deleted_at");

-- CreateIndex
CREATE INDEX "credit_term_name_idx" ON "tb_credit_term"("name");

-- CreateIndex
CREATE UNIQUE INDEX "credit_term_name_u" ON "tb_credit_term"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "dimension_key_idx" ON "tb_dimension"("key");

-- CreateIndex
CREATE UNIQUE INDEX "dimension_key_u" ON "tb_dimension"("key", "deleted_at");

-- CreateIndex
CREATE INDEX "dimension_display_in_idx" ON "tb_dimension_display_in"("dimension_id", "display_in");

-- CreateIndex
CREATE UNIQUE INDEX "dimension_display_in_u" ON "tb_dimension_display_in"("dimension_id", "display_in", "deleted_at");

-- CreateIndex
CREATE INDEX "extra_cost_name_idx" ON "tb_extra_cost"("name");

-- CreateIndex
CREATE INDEX "extra_cost_detail_extra_cost_id_extra_cost_type_id_idx" ON "tb_extra_cost_detail"("extra_cost_id", "extra_cost_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "extra_cost_detail_extra_cost_id_extra_cost_type_id_u" ON "tb_extra_cost_detail"("extra_cost_id", "extra_cost_type_id", "deleted_at");

-- CreateIndex
CREATE INDEX "extra_cost_type_name_idx" ON "tb_extra_cost_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "extra_cost_type_name_u" ON "tb_extra_cost_type"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "vendor_business_type_name_idx" ON "tb_vendor_business_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_business_type_name_u" ON "tb_vendor_business_type"("name", "deleted_at");

-- CreateIndex
CREATE INDEX "application_config_key_id_idx" ON "tb_application_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "application_config_key_u" ON "tb_application_config"("key", "deleted_at");

-- CreateIndex
CREATE INDEX "application_user_config_idx" ON "tb_application_user_config"("user_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "application_user_config_u" ON "tb_application_user_config"("user_id", "key", "deleted_at");

-- AddForeignKey
ALTER TABLE "tb_credit_note" ADD CONSTRAINT "tb_credit_note_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note" ADD CONSTRAINT "tb_credit_note_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note" ADD CONSTRAINT "tb_credit_note_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "tb_good_received_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note" ADD CONSTRAINT "tb_credit_note_cn_reason_id_fkey" FOREIGN KEY ("cn_reason_id") REFERENCES "tb_credit_note_reason"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_comment" ADD CONSTRAINT "tb_credit_note_comment_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "tb_credit_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail" ADD CONSTRAINT "tb_credit_note_detail_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "tb_credit_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail" ADD CONSTRAINT "tb_credit_note_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail" ADD CONSTRAINT "tb_credit_note_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail" ADD CONSTRAINT "tb_credit_note_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail" ADD CONSTRAINT "tb_credit_note_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_note_detail_comment" ADD CONSTRAINT "tb_credit_note_detail_comment_credit_note_detail_id_fkey" FOREIGN KEY ("credit_note_detail_id") REFERENCES "tb_credit_note_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_currency_comment" ADD CONSTRAINT "tb_currency_comment_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_delivery_point_comment" ADD CONSTRAINT "tb_delivery_point_comment_delivery_point_id_fkey" FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_department_comment" ADD CONSTRAINT "tb_department_comment_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "tb_department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_exchange_rate" ADD CONSTRAINT "tb_exchange_rate_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_exchange_rate_comment" ADD CONSTRAINT "tb_exchange_rate_comment_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "tb_exchange_rate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note" ADD CONSTRAINT "tb_good_received_note_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note" ADD CONSTRAINT "tb_good_received_note_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_comment" ADD CONSTRAINT "tb_good_received_note_comment_good_received_note_id_fkey" FOREIGN KEY ("good_received_note_id") REFERENCES "tb_good_received_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail" ADD CONSTRAINT "tb_good_received_note_detail_good_received_note_id_fkey" FOREIGN KEY ("good_received_note_id") REFERENCES "tb_good_received_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail" ADD CONSTRAINT "tb_good_received_note_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail" ADD CONSTRAINT "tb_good_received_note_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail" ADD CONSTRAINT "tb_good_received_note_detail_purchase_order_detail_id_fkey" FOREIGN KEY ("purchase_order_detail_id") REFERENCES "tb_purchase_order_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_comment" ADD CONSTRAINT "tb_good_received_note_detail_comment_good_received_note_de_fkey" FOREIGN KEY ("good_received_note_detail_id") REFERENCES "tb_good_received_note_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_item" ADD CONSTRAINT "tb_good_received_note_detail_item_good_received_note_detai_fkey" FOREIGN KEY ("good_received_note_detail_id") REFERENCES "tb_good_received_note_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_item" ADD CONSTRAINT "tb_good_received_note_detail_item_order_unit_id_fkey" FOREIGN KEY ("order_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_item" ADD CONSTRAINT "tb_good_received_note_detail_item_received_unit_id_fkey" FOREIGN KEY ("received_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_item" ADD CONSTRAINT "tb_good_received_note_detail_item_foc_unit_id_fkey" FOREIGN KEY ("foc_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_good_received_note_detail_item" ADD CONSTRAINT "tb_good_received_note_detail_item_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_inventory_transaction_detail" ADD CONSTRAINT "tb_inventory_transaction_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_inventory_transaction_cost_layer" ADD CONSTRAINT "tb_inventory_transaction_clos_inventory_transaction_detail_fkey" FOREIGN KEY ("inventory_transaction_detail_id") REFERENCES "tb_inventory_transaction_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_inventory_transaction_cost_layer" ADD CONSTRAINT "tb_inventory_transaction_cost_layer_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "tb_period"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_period_comment" ADD CONSTRAINT "tb_period_comment_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "tb_period"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_period_snapshot" ADD CONSTRAINT "tb_period_snapshot_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "tb_period"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_location" ADD CONSTRAINT "tb_location_delivery_point_id_fkey" FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_location_comment" ADD CONSTRAINT "tb_location_comment_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_tax_profile_comment" ADD CONSTRAINT "tb_tax_profile_comment_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product" ADD CONSTRAINT "tb_product_inventory_unit_id_fkey" FOREIGN KEY ("inventory_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product" ADD CONSTRAINT "tb_product_product_item_group_id_fkey" FOREIGN KEY ("product_item_group_id") REFERENCES "tb_product_item_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product" ADD CONSTRAINT "tb_product_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_comment" ADD CONSTRAINT "tb_product_comment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_category" ADD CONSTRAINT "tb_product_category_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_category_comment" ADD CONSTRAINT "tb_product_category_comment_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "tb_product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_item_group" ADD CONSTRAINT "tb_product_item_group_product_subcategory_id_fkey" FOREIGN KEY ("product_subcategory_id") REFERENCES "tb_product_sub_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_item_group" ADD CONSTRAINT "tb_product_item_group_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_item_group_comment" ADD CONSTRAINT "tb_product_item_group_comment_product_item_group_id_fkey" FOREIGN KEY ("product_item_group_id") REFERENCES "tb_product_item_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_sub_category" ADD CONSTRAINT "tb_product_sub_category_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "tb_product_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_sub_category" ADD CONSTRAINT "tb_product_sub_category_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_sub_category_comment" ADD CONSTRAINT "tb_product_sub_category_comment_product_sub_category_id_fkey" FOREIGN KEY ("product_sub_category_id") REFERENCES "tb_product_sub_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_tb_vendor" ADD CONSTRAINT "tb_product_tb_vendor_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_tb_vendor" ADD CONSTRAINT "tb_product_tb_vendor_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order" ADD CONSTRAINT "tb_purchase_order_credit_term_id_fkey" FOREIGN KEY ("credit_term_id") REFERENCES "tb_credit_term"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order" ADD CONSTRAINT "tb_purchase_order_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order" ADD CONSTRAINT "tb_purchase_order_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_comment" ADD CONSTRAINT "tb_purchase_order_comment_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "tb_purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail" ADD CONSTRAINT "tb_purchase_order_detail_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail" ADD CONSTRAINT "tb_purchase_order_detail_order_unit_id_fkey" FOREIGN KEY ("order_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail" ADD CONSTRAINT "tb_purchase_order_detail_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "tb_purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail" ADD CONSTRAINT "tb_purchase_order_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail_comment" ADD CONSTRAINT "tb_purchase_order_detail_comment_purchase_order_detail_id_fkey" FOREIGN KEY ("purchase_order_detail_id") REFERENCES "tb_purchase_order_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail_tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_order_detail_tb_purchase_request_detail_po_det_fkey" FOREIGN KEY ("po_detail_id") REFERENCES "tb_purchase_order_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail_tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_order_detail_tb_purchase_request_detail_pr_det_fkey" FOREIGN KEY ("pr_detail_id") REFERENCES "tb_purchase_request_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request" ADD CONSTRAINT "tb_purchase_request_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "tb_workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_comment" ADD CONSTRAINT "tb_purchase_request_comment_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "tb_purchase_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_approved_unit_id_fkey" FOREIGN KEY ("approved_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_foc_unit_id_fkey" FOREIGN KEY ("foc_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_pricelist_detail_id_fkey" FOREIGN KEY ("pricelist_detail_id") REFERENCES "tb_pricelist_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "tb_purchase_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_requested_unit_id_fkey" FOREIGN KEY ("requested_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail_comment" ADD CONSTRAINT "tb_purchase_request_detail_comment_purchase_request_detail_fkey" FOREIGN KEY ("purchase_request_detail_id") REFERENCES "tb_purchase_request_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template" ADD CONSTRAINT "tb_purchase_request_template_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "tb_workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_comment" ADD CONSTRAINT "tb_purchase_request_template_comment_purchase_request_temp_fkey" FOREIGN KEY ("purchase_request_template_id") REFERENCES "tb_purchase_request_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_foc_unit_id_fkey" FOREIGN KEY ("foc_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_purchase_request_templ_fkey" FOREIGN KEY ("purchase_request_template_id") REFERENCES "tb_purchase_request_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_requested_unit_id_fkey" FOREIGN KEY ("requested_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_template_detail" ADD CONSTRAINT "tb_purchase_request_template_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_comment" ADD CONSTRAINT "tb_stock_in_comment_stock_in_id_fkey" FOREIGN KEY ("stock_in_id") REFERENCES "tb_stock_in"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_detail" ADD CONSTRAINT "tb_stock_in_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_detail" ADD CONSTRAINT "tb_stock_in_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_detail" ADD CONSTRAINT "tb_stock_in_detail_stock_in_id_fkey" FOREIGN KEY ("stock_in_id") REFERENCES "tb_stock_in"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_detail" ADD CONSTRAINT "tb_stock_in_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_in_detail_comment" ADD CONSTRAINT "tb_stock_in_detail_comment_stock_in_detail_id_fkey" FOREIGN KEY ("stock_in_detail_id") REFERENCES "tb_stock_in_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_comment" ADD CONSTRAINT "tb_stock_out_comment_stock_out_id_fkey" FOREIGN KEY ("stock_out_id") REFERENCES "tb_stock_out"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_detail" ADD CONSTRAINT "tb_stock_out_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_detail" ADD CONSTRAINT "tb_stock_out_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_detail" ADD CONSTRAINT "tb_stock_out_detail_stock_out_id_fkey" FOREIGN KEY ("stock_out_id") REFERENCES "tb_stock_out"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_detail" ADD CONSTRAINT "tb_stock_out_detail_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out_detail_comment" ADD CONSTRAINT "tb_stock_out_detail_comment_stock_out_detail_id_fkey" FOREIGN KEY ("stock_out_detail_id") REFERENCES "tb_stock_out_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition" ADD CONSTRAINT "tb_store_requisition_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition" ADD CONSTRAINT "tb_store_requisition_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "tb_workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition" ADD CONSTRAINT "tb_store_requisition_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition_comment" ADD CONSTRAINT "tb_store_requisition_comment_store_requisition_id_fkey" FOREIGN KEY ("store_requisition_id") REFERENCES "tb_store_requisition"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition_detail" ADD CONSTRAINT "tb_store_requisition_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition_detail" ADD CONSTRAINT "tb_store_requisition_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition_detail" ADD CONSTRAINT "tb_store_requisition_detail_store_requisition_id_fkey" FOREIGN KEY ("store_requisition_id") REFERENCES "tb_store_requisition"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_store_requisition_detail_comment" ADD CONSTRAINT "tb_store_requisition_detail_comment_store_requisition_deta_fkey" FOREIGN KEY ("store_requisition_detail_id") REFERENCES "tb_store_requisition_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_unit_comment" ADD CONSTRAINT "tb_unit_comment_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_unit_conversion" ADD CONSTRAINT "tb_unit_conversion_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_unit_conversion" ADD CONSTRAINT "tb_unit_conversion_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_unit_conversion" ADD CONSTRAINT "tb_unit_conversion_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_vendor" ADD CONSTRAINT "tb_vendor_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_vendor_comment" ADD CONSTRAINT "tb_vendor_comment_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_vendor_address" ADD CONSTRAINT "tb_vendor_address_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_vendor_contact" ADD CONSTRAINT "tb_vendor_contact_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_workflow_comment" ADD CONSTRAINT "tb_workflow_comment_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "tb_workflow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_count_stock" ADD CONSTRAINT "tb_count_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_count_stock_comment" ADD CONSTRAINT "tb_count_stock_comment_count_stock_id_fkey" FOREIGN KEY ("count_stock_id") REFERENCES "tb_count_stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_count_stock_detail" ADD CONSTRAINT "tb_count_stock_detail_count_stock_id_fkey" FOREIGN KEY ("count_stock_id") REFERENCES "tb_count_stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_count_stock_detail" ADD CONSTRAINT "tb_count_stock_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_count_stock_detail_comment" ADD CONSTRAINT "tb_count_stock_detail_comment_count_stock_detail_id_fkey" FOREIGN KEY ("count_stock_detail_id") REFERENCES "tb_count_stock_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_spot_check" ADD CONSTRAINT "tb_spot_check_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_spot_check_comment" ADD CONSTRAINT "tb_spot_check_comment_spot_check_id_fkey" FOREIGN KEY ("spot_check_id") REFERENCES "tb_spot_check"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_spot_check_detail" ADD CONSTRAINT "tb_spot_check_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_spot_check_detail" ADD CONSTRAINT "tb_spot_check_detail_spot_check_id_fkey" FOREIGN KEY ("spot_check_id") REFERENCES "tb_spot_check"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_spot_check_detail_comment" ADD CONSTRAINT "tb_spot_check_detail_comment_spot_check_detail_id_fkey" FOREIGN KEY ("spot_check_detail_id") REFERENCES "tb_spot_check_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_jv_detail" ADD CONSTRAINT "tb_jv_detail_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_jv_detail" ADD CONSTRAINT "tb_jv_detail_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_jv_detail" ADD CONSTRAINT "tb_jv_detail_jv_header_id_fkey" FOREIGN KEY ("jv_header_id") REFERENCES "tb_jv_header"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_jv_header" ADD CONSTRAINT "tb_jv_header_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_jv_header" ADD CONSTRAINT "tb_jv_header_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_template" ADD CONSTRAINT "tb_pricelist_template_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_template_comment" ADD CONSTRAINT "tb_pricelist_template_comment_pricelist_template_id_fkey" FOREIGN KEY ("pricelist_template_id") REFERENCES "tb_pricelist_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_template_detail" ADD CONSTRAINT "tb_pricelist_template_detail_pricelist_template_id_fkey" FOREIGN KEY ("pricelist_template_id") REFERENCES "tb_pricelist_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_template_detail" ADD CONSTRAINT "tb_pricelist_template_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_template_detail_comment" ADD CONSTRAINT "tb_pricelist_template_detail_comment_pricelist_template_de_fkey" FOREIGN KEY ("pricelist_template_detail_id") REFERENCES "tb_pricelist_template_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing" ADD CONSTRAINT "tb_request_for_pricing_pricelist_template_id_fkey" FOREIGN KEY ("pricelist_template_id") REFERENCES "tb_pricelist_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing_comment" ADD CONSTRAINT "tb_request_for_pricing_comment_request_for_pricing_id_fkey" FOREIGN KEY ("request_for_pricing_id") REFERENCES "tb_request_for_pricing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing_detail" ADD CONSTRAINT "tb_request_for_pricing_detail_request_for_pricing_id_fkey" FOREIGN KEY ("request_for_pricing_id") REFERENCES "tb_request_for_pricing"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing_detail" ADD CONSTRAINT "tb_request_for_pricing_detail_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing_detail" ADD CONSTRAINT "tb_request_for_pricing_detail_pricelist_id_fkey" FOREIGN KEY ("pricelist_id") REFERENCES "tb_pricelist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_request_for_pricing_detail_comment" ADD CONSTRAINT "tb_request_for_pricing_detail_comment_request_for_pricing__fkey" FOREIGN KEY ("request_for_pricing_detail_id") REFERENCES "tb_request_for_pricing_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist" ADD CONSTRAINT "tb_pricelist_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "tb_vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist" ADD CONSTRAINT "tb_pricelist_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tb_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_comment" ADD CONSTRAINT "tb_pricelist_comment_pricelist_id_fkey" FOREIGN KEY ("pricelist_id") REFERENCES "tb_pricelist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_detail" ADD CONSTRAINT "tb_pricelist_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_detail" ADD CONSTRAINT "tb_pricelist_detail_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "tb_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_detail" ADD CONSTRAINT "tb_pricelist_detail_pricelist_id_fkey" FOREIGN KEY ("pricelist_id") REFERENCES "tb_pricelist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_detail" ADD CONSTRAINT "tb_pricelist_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_pricelist_detail_comment" ADD CONSTRAINT "tb_pricelist_detail_comment_pricelist_detail_id_fkey" FOREIGN KEY ("pricelist_detail_id") REFERENCES "tb_pricelist_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_location" ADD CONSTRAINT "tb_product_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_product_location" ADD CONSTRAINT "tb_product_location_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_department_user" ADD CONSTRAINT "tb_department_user_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "tb_department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_user_location" ADD CONSTRAINT "tb_user_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_config_running_code_comment" ADD CONSTRAINT "tb_config_running_code_comment_config_running_code_id_fkey" FOREIGN KEY ("config_running_code_id") REFERENCES "tb_config_running_code"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_credit_term_comment" ADD CONSTRAINT "tb_credit_term_comment_credit_term_id_fkey" FOREIGN KEY ("credit_term_id") REFERENCES "tb_credit_term"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_dimension_comment" ADD CONSTRAINT "tb_dimension_comment_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "tb_dimension"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_dimension_display_in" ADD CONSTRAINT "tb_dimension_display_in_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "tb_dimension"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost" ADD CONSTRAINT "tb_extra_cost_good_received_note_id_fkey" FOREIGN KEY ("good_received_note_id") REFERENCES "tb_good_received_note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost_comment" ADD CONSTRAINT "tb_extra_cost_comment_extra_cost_id_fkey" FOREIGN KEY ("extra_cost_id") REFERENCES "tb_extra_cost"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost_detail" ADD CONSTRAINT "tb_extra_cost_detail_extra_cost_id_fkey" FOREIGN KEY ("extra_cost_id") REFERENCES "tb_extra_cost"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost_detail" ADD CONSTRAINT "tb_extra_cost_detail_extra_cost_type_id_fkey" FOREIGN KEY ("extra_cost_type_id") REFERENCES "tb_extra_cost_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost_detail" ADD CONSTRAINT "tb_extra_cost_detail_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tb_tax_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_extra_cost_detail_comment" ADD CONSTRAINT "tb_extra_cost_detail_comment_extra_cost_detail_id_fkey" FOREIGN KEY ("extra_cost_detail_id") REFERENCES "tb_extra_cost_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_vendor_business_type_comment" ADD CONSTRAINT "tb_vendor_business_type_comment_vendor_business_type_id_fkey" FOREIGN KEY ("vendor_business_type_id") REFERENCES "tb_vendor_business_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
