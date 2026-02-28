/*
  Warnings:

  - You are about to drop the column `ambienteId` on the `oportunidades` table. All the data in the column will be lost.
  - You are about to drop the `ambientes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ambientes" DROP CONSTRAINT "ambientes_userId_fkey";

-- DropForeignKey
ALTER TABLE "oportunidades" DROP CONSTRAINT "oportunidades_ambienteId_fkey";

-- AlterTable
ALTER TABLE "oportunidades" DROP COLUMN "ambienteId";

-- AlterTable
ALTER TABLE "tarefas" ADD COLUMN     "notificacaoExcluida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificar" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ambientes";
