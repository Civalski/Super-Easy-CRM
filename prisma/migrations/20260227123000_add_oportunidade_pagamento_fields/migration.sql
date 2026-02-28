-- AlterTable
ALTER TABLE "oportunidades"
ADD COLUMN "formaPagamento" TEXT,
ADD COLUMN "parcelas" INTEGER,
ADD COLUMN "desconto" DOUBLE PRECISION;
