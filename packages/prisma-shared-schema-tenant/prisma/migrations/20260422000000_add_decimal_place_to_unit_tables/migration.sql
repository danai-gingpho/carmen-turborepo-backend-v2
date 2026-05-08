ALTER TABLE "tb_unit"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;

ALTER TABLE "tb_unit_conversion"
  ADD COLUMN "decimal_place" INTEGER NOT NULL DEFAULT 2;
