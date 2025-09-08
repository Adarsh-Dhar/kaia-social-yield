-- Set DEFAULT NOW() on updatedAt columns
ALTER TABLE "public"."Campaign" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "public"."Mission" ALTER COLUMN "updatedAt" SET DEFAULT NOW();