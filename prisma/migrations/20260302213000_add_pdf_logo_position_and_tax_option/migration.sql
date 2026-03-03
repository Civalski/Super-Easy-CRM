ALTER TABLE "pdf_config"
ADD COLUMN "logoPosicao" TEXT DEFAULT 'topo',
ADD COLUMN "tributacaoInclusa" BOOLEAN NOT NULL DEFAULT false;
