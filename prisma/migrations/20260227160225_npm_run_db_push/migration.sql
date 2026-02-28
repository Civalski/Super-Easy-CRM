-- AlterEnum
ALTER TYPE "GoalMetricType" ADD VALUE 'FATURAMENTO';

-- AlterTable
ALTER TABLE "oportunidades" ALTER COLUMN "status" SET DEFAULT 'orcamento';

-- CreateTable
CREATE TABLE "meta_contato_config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metaDiaria" INTEGER NOT NULL DEFAULT 25,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_contato_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_contato_dias_esquecidos" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_contato_dias_esquecidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meta_contato_config_userId_key" ON "meta_contato_config"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meta_contato_dias_esquecidos_configId_data_key" ON "meta_contato_dias_esquecidos"("configId", "data");

-- AddForeignKey
ALTER TABLE "meta_contato_config" ADD CONSTRAINT "meta_contato_config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_contato_dias_esquecidos" ADD CONSTRAINT "meta_contato_dias_esquecidos_configId_fkey" FOREIGN KEY ("configId") REFERENCES "meta_contato_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
