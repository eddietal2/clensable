-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "radius" INTEGER,
ADD COLUMN     "targetZip" TEXT;
