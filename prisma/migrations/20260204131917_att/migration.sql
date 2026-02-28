-- AlterTable
ALTER TABLE "goals" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "goal_snapshots" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "current" INTEGER NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "goal_snapshots_goalId_periodStart_periodEnd_key" ON "goal_snapshots"("goalId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "goal_snapshots" ADD CONSTRAINT "goal_snapshots_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
