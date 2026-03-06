-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "numero" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numero_key" ON "clientes"("numero");
