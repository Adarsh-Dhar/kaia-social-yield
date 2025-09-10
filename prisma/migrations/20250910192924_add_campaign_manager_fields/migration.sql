-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxReward" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "minReward" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "nftTokenURI" TEXT DEFAULT 'https://example.com/nft-metadata.json';
