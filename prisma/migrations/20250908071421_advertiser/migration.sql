-- DropIndex
DROP INDEX "ActiveBoost_userId_key";

-- AlterTable
ALTER TABLE "ActiveBoost" ADD COLUMN     "campaignId" TEXT;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "verificationUrl" TEXT;

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "remainingBudget" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "advertiserId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_contactEmail_key" ON "Advertiser"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_walletAddress_key" ON "Advertiser"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_missionId_key" ON "Campaign"("missionId");

-- CreateIndex
CREATE INDEX "Campaign_advertiserId_idx" ON "Campaign"("advertiserId");

-- CreateIndex
CREATE INDEX "ActiveBoost_userId_idx" ON "ActiveBoost"("userId");

-- CreateIndex
CREATE INDEX "ActiveBoost_campaignId_idx" ON "ActiveBoost"("campaignId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveBoost" ADD CONSTRAINT "ActiveBoost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
