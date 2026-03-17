ALTER TABLE "contratos"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'em_andamento';

CREATE INDEX IF NOT EXISTS "contratos_userId_status_idx"
ON "contratos"("userId", "status");
