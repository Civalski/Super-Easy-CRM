-- CreateTable
CREATE TABLE "prospecto_envio_agendado" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lote" TEXT,
    "dataEnvio" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "enviados" INTEGER NOT NULL DEFAULT 0,
    "executadoEm" TIMESTAMP(3),
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospecto_envio_agendado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prospecto_envio_agendado_userId_dataEnvio_status_idx" ON "prospecto_envio_agendado"("userId", "dataEnvio", "status");

-- CreateIndex
CREATE INDEX "prospecto_envio_agendado_userId_lote_status_idx" ON "prospecto_envio_agendado"("userId", "lote", "status");

-- AddForeignKey
ALTER TABLE "prospecto_envio_agendado" ADD CONSTRAINT "prospecto_envio_agendado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
