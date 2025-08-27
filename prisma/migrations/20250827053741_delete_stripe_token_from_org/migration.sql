/*
  Warnings:

  - You are about to drop the column `stripeToken` on the `Org` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Org" DROP COLUMN "stripeToken";
