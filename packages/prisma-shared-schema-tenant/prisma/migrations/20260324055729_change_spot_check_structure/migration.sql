/*
  Warnings:

  - You are about to drop the column `qty` on the `tb_spot_check_detail` table. All the data in the column will be lost.
  - Added the required column `inventory_unit_id` to the `tb_spot_check_detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tb_physical_count_detail" ADD COLUMN     "counted_at" TIMESTAMPTZ(6),
ADD COLUMN     "counted_by_id" UUID,
ALTER COLUMN "on_hand_qty" DROP NOT NULL,
ALTER COLUMN "on_hand_qty" SET DEFAULT 0,
ALTER COLUMN "counted_qty" DROP NOT NULL,
ALTER COLUMN "diff_qty" DROP NOT NULL,
ALTER COLUMN "diff_qty" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "tb_spot_check_detail" DROP COLUMN "qty",
ADD COLUMN     "count_qty" DECIMAL(20,5),
ADD COLUMN     "counted_at" TIMESTAMPTZ(6),
ADD COLUMN     "counted_by_id" UUID,
ADD COLUMN     "diff_qty" DECIMAL(20,5) DEFAULT 0,
ADD COLUMN     "inventory_unit_id" UUID NOT NULL,
ADD COLUMN     "on_hand_qty" DECIMAL(20,5) DEFAULT 0;

-- AddForeignKey
ALTER TABLE "tb_spot_check_detail" ADD CONSTRAINT "tb_spot_check_detail_inventory_unit_id_fkey" FOREIGN KEY ("inventory_unit_id") REFERENCES "tb_unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
