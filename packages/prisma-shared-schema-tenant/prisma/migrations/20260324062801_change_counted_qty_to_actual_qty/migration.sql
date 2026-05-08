/*
  Warnings:

  - You are about to drop the column `counted_qty` on the `tb_physical_count_detail` table. All the data in the column will be lost.
  - You are about to drop the column `count_qty` on the `tb_spot_check_detail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tb_physical_count_detail" DROP COLUMN "counted_qty",
ADD COLUMN     "actual_qty" DECIMAL(20,5);

-- AlterTable
ALTER TABLE "tb_spot_check_detail" DROP COLUMN "count_qty",
ADD COLUMN     "actual_qty" DECIMAL(20,5);
