ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "demoModeActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "demoDataSeededAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "demo_data_records" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "demo_data_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "demo_data_records_userId_model_idx"
ON "demo_data_records"("userId", "model");

CREATE UNIQUE INDEX IF NOT EXISTS "demo_data_records_userId_model_recordId_key"
ON "demo_data_records"("userId", "model", "recordId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'demo_data_records_userId_fkey'
  ) THEN
    ALTER TABLE "demo_data_records"
    ADD CONSTRAINT "demo_data_records_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;
