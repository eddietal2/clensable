-- CreateTable
CREATE TABLE "public"."CampaignLeadBlacklist" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignLeadBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignLeadBlacklist_campaignId_placeId_key" ON "public"."CampaignLeadBlacklist"("campaignId", "placeId");

-- AddForeignKey
ALTER TABLE "public"."CampaignLeadBlacklist" ADD CONSTRAINT "CampaignLeadBlacklist_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
