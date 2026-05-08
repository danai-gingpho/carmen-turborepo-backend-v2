-- AlterTable
ALTER TABLE "tb_stock_in" ADD COLUMN     "si_date" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "tb_stock_out" ADD COLUMN     "so_date" TIMESTAMPTZ(6);
