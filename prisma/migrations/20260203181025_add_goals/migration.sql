-- CreateEnum
CREATE TYPE "GoalMetricType" AS ENUM ('CLIENTES_CONTATADOS', 'PROPOSTAS', 'CLIENTES_CADASTRADOS', 'VENDAS', 'QUALIFICACAO', 'NEGOCIACAO', 'PROSPECCAO');

-- CreateEnum
CREATE TYPE "GoalPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metricType" "GoalMetricType" NOT NULL,
    "periodType" "GoalPeriodType" NOT NULL,
    "target" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "weekDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
