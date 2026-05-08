/*
  Warnings:

  - You are about to drop the column `parent_bu` on the `tb_cluster_user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tb_cluster_user" DROP COLUMN "parent_bu",
ADD COLUMN     "parent_bu_id" UUID;
