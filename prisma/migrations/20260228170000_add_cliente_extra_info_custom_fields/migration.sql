ALTER TABLE "clientes"
ADD COLUMN "cargo" TEXT,
ADD COLUMN "documento" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "dataNascimento" TEXT,
ADD COLUMN "observacoes" TEXT,
ADD COLUMN "camposPersonalizados" JSONB;
