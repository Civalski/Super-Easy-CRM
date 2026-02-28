-- DropForeignKey
ALTER TABLE "prospectos" DROP CONSTRAINT "prospectos_clienteId_userId_fkey";

-- AddForeignKey
ALTER TABLE "prospectos" ADD CONSTRAINT "prospectos_clienteId_userId_fkey" FOREIGN KEY ("clienteId", "userId") REFERENCES "clientes"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
