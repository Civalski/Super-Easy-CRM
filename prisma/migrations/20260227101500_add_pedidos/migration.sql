-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oportunidadeId" TEXT NOT NULL,
    "statusEntrega" TEXT NOT NULL DEFAULT 'pendente',
    "formaPagamento" TEXT,
    "dataEntrega" TIMESTAMP(3),
    "dataAprovacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_oportunidadeId_key" ON "pedidos"("oportunidadeId");

-- CreateIndex
CREATE INDEX "pedidos_userId_statusEntrega_idx" ON "pedidos"("userId", "statusEntrega");

-- CreateIndex
CREATE INDEX "pedidos_userId_dataEntrega_idx" ON "pedidos"("userId", "dataEntrega");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
