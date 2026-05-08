-- CreateTable
CREATE TABLE "tb_dashboard_layout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" UUID NOT NULL,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_dashboard_layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_dashboard_widget" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dashboard_id" UUID NOT NULL,
    "widget_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "grid_x" INTEGER NOT NULL DEFAULT 0,
    "grid_y" INTEGER NOT NULL DEFAULT 0,
    "grid_w" INTEGER NOT NULL DEFAULT 4,
    "grid_h" INTEGER NOT NULL DEFAULT 3,
    "data_source_url" VARCHAR(500) NOT NULL,
    "data_filters" JSONB DEFAULT '{}',
    "chart_config" JSONB DEFAULT '{}',
    "display_config" JSONB DEFAULT '{}',
    "refresh_interval_sec" INTEGER DEFAULT 300,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_dashboard_widget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_dashboard_layout_owner" ON "tb_dashboard_layout"("owner_id");

-- CreateIndex
CREATE INDEX "idx_dashboard_layout_default" ON "tb_dashboard_layout"("is_default", "owner_id");

-- CreateIndex
CREATE INDEX "idx_dashboard_widget_dashboard" ON "tb_dashboard_widget"("dashboard_id");

-- AddForeignKey
ALTER TABLE "tb_dashboard_widget" ADD CONSTRAINT "tb_dashboard_widget_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "tb_dashboard_layout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
