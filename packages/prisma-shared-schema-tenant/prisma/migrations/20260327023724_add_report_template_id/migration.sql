-- AlterTable
ALTER TABLE "tb_report_schedule" ADD COLUMN     "report_template_id" UUID,
ADD COLUMN     "schedule_config" JSONB;
