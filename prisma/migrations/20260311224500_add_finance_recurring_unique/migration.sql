-- Defensive cleanup: remove duplicate schedule rows in the same recurring group/day.
DELETE FROM "contas_receber" a
USING "contas_receber" b
WHERE a."id" > b."id"
  AND a."userId" = b."userId"
  AND a."grupoParcelaId" IS NOT NULL
  AND b."grupoParcelaId" IS NOT NULL
  AND a."dataVencimento" IS NOT NULL
  AND b."dataVencimento" IS NOT NULL
  AND a."grupoParcelaId" = b."grupoParcelaId"
  AND a."dataVencimento" = b."dataVencimento";

-- Idempotency guarantee for recurring generation.
CREATE UNIQUE INDEX IF NOT EXISTS "contas_receber_userId_grupoParcelaId_dataVencimento_key"
ON "contas_receber"("userId", "grupoParcelaId", "dataVencimento");
