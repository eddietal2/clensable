-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT';
