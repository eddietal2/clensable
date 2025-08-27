/*
  Warnings:

  - The `radius` column on the `Org` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Org" DROP COLUMN "radius",
ADD COLUMN     "radius" INTEGER;
