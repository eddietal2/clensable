/*
  Warnings:

  - You are about to drop the `Business` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Outreach` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Business" DROP CONSTRAINT "Business_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Outreach" DROP CONSTRAINT "Outreach_campaignId_fkey";

-- DropTable
DROP TABLE "public"."Business";

-- DropTable
DROP TABLE "public"."Outreach";

-- CreateTable
CREATE TABLE "public"."OutreachGroup" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutreachLead" (
    "id" TEXT NOT NULL,
    "outreachGroupId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "leadData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachGroup_campaignId_key" ON "public"."OutreachGroup"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachLead_outreachGroupId_placeId_key" ON "public"."OutreachLead"("outreachGroupId", "placeId");

-- AddForeignKey
ALTER TABLE "public"."OutreachGroup" ADD CONSTRAINT "OutreachGroup_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutreachLead" ADD CONSTRAINT "OutreachLead_outreachGroupId_fkey" FOREIGN KEY ("outreachGroupId") REFERENCES "public"."OutreachGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
