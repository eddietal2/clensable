/*
  Warnings:

  - Made the column `category` on table `Campaign` required. This step will fail if there are existing NULL values in that column.
  - Made the column `radius` on table `Campaign` required. This step will fail if there are existing NULL values in that column.
  - Made the column `targetZip` on table `Campaign` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Campaign" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "radius" SET NOT NULL,
ALTER COLUMN "targetZip" SET NOT NULL;
