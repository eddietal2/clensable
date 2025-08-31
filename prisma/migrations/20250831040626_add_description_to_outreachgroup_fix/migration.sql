/*
  Warnings:

  - You are about to drop the column `description` on the `OutreachLead` table. All the data in the column will be lost.
  - Added the required column `description` to the `OutreachGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OutreachGroup" ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."OutreachLead" DROP COLUMN "description";
