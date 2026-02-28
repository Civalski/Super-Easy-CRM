ALTER TABLE "contas_receber"
ADD COLUMN "recorrenteMensal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recorrenciaAtiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recorrenciaDiaVencimento" INTEGER;

CREATE INDEX "contas_receber_userId_recorrenteMensal_recorrenciaAtiva_idx"
ON "contas_receber"("userId", "recorrenteMensal", "recorrenciaAtiva");
