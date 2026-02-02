/*
  Warnings:

  - Added the required column `contents` to the `tb_news` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deleted_at` to the `tb_news` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tb_news" ADD COLUMN     "contents" VARCHAR NOT NULL,
ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "deleted_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;
