ALTER TABLE "contas_receber"
ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'receber',
ADD COLUMN "autoDebito" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "grupoParcelaId" TEXT,
ADD COLUMN "numeroParcela" INTEGER,
ADD COLUMN "totalParcelas" INTEGER;

DROP INDEX IF EXISTS "contas_receber_userId_status_dataVencimento_idx";
CREATE INDEX "contas_receber_userId_tipo_status_dataVencimento_idx"
ON "contas_receber"("userId", "tipo", "status", "dataVencimento");
