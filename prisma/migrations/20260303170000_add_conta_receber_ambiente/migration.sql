ALTER TABLE "contas_receber"
ADD COLUMN IF NOT EXISTS "ambiente" TEXT NOT NULL DEFAULT 'geral';

CREATE INDEX IF NOT EXISTS "contas_receber_userId_ambiente_tipo_status_dataVencimento_idx"
ON "contas_receber"("userId", "ambiente", "tipo", "status", "dataVencimento");

DROP INDEX IF EXISTS "contas_receber_userId_tipo_status_dataVencimento_idx";
