ALTER TABLE "pedidos"
ADD COLUMN "numero" SERIAL NOT NULL;

CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");
