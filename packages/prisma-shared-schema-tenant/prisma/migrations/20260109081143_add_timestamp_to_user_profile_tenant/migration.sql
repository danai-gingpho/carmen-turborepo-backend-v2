-- AlterTable
ALTER TABLE "tb_user_profile" ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "deleted_by_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by_id" UUID;
