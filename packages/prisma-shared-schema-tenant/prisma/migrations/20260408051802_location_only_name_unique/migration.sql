/*
  Warnings:

  - A unique constraint covering the columns `[name,deleted_at]` on the table `tb_location` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "location_code_name_u";

-- CreateIndex
CREATE UNIQUE INDEX "location_name_u" ON "tb_location"("name", "deleted_at");
