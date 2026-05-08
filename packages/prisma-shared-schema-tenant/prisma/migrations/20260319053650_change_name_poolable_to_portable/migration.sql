/*
  Warnings:

  - You are about to drop the column `is_poolable` on the `tb_recipe_equipment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tb_recipe_equipment" DROP COLUMN "is_poolable",
ADD COLUMN     "is_portable" BOOLEAN DEFAULT false;
