/*
  Warnings:

  - Added the required column `passwordHash` to the `Advertiser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Advertiser" ADD COLUMN     "passwordHash" TEXT NOT NULL;
