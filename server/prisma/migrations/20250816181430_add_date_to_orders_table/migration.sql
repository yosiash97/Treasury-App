/*
  Warnings:

  - Added the required column `submitted_at` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL;
