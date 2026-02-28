ALTER TABLE "produtos_servicos"
ADD COLUMN "codigo" TEXT,
ADD COLUMN "categoria" TEXT,
ADD COLUMN "unidade" TEXT NOT NULL DEFAULT 'UN',
ADD COLUMN "custoPadrao" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "tempoPadraoMinutos" INTEGER;

CREATE INDEX "produtos_servicos_userId_tipo_ativo_idx" ON "produtos_servicos"("userId", "tipo", "ativo");
CREATE INDEX "produtos_servicos_userId_categoria_idx" ON "produtos_servicos"("userId", "categoria");
CREATE UNIQUE INDEX "produtos_servicos_userId_codigo_key" ON "produtos_servicos"("userId", "codigo");