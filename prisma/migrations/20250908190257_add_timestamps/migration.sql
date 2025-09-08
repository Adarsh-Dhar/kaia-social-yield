-- Add updatedAt and createdAt with sensible defaults if not present
DO $$ BEGIN
  -- Campaign.updatedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Campaign' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Campaign" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
  END IF;

  -- Mission.createdAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Mission' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "Mission" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
  END IF;

  -- Mission.updatedAt
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Mission' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Mission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
  END IF;
END $$;