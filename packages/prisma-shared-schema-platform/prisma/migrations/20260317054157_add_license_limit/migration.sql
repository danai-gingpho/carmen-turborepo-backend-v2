-- AlterTable
ALTER TABLE "tb_business_unit" ADD COLUMN     "max_license_users" INTEGER;

-- AlterTable
ALTER TABLE "tb_cluster" ADD COLUMN     "max_license_bu" INTEGER;
