ALTER TABLE "produtos_servicos"
ADD COLUMN "marca" TEXT,
ADD COLUMN "codigoBarras" TEXT,
ADD COLUMN "observacoesInternas" TEXT,
ADD COLUMN "comissaoPercentual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "controlaEstoque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "estoqueAtual" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "garantiaDias" INTEGER,
ADD COLUMN "prazoEntregaDias" INTEGER;

CREATE INDEX "produtos_servicos_userId_marca_idx" ON "produtos_servicos"("userId", "marca");