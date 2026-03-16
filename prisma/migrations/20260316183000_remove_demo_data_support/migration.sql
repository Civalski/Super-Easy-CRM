DROP TABLE IF EXISTS "demo_data_records";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "demoModeActive",
DROP COLUMN IF EXISTS "demoDataSeededAt";
