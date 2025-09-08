-- Ensure updatedAt columns have defaults
ALTER TABLE "Mission" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "Campaign" ALTER COLUMN "updatedAt" SET DEFAULT NOW();