/*
  Warnings:

  - Added the required column `name` to the `OutreachGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OutreachGroup" ADD COLUMN     "name" TEXT NOT NULL;
