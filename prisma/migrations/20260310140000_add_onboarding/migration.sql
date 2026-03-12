-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "empresa_config" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "areaAtuacao" TEXT,
  "tipoPublico" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "empresa_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "empresa_config_userId_key" ON "empresa_config"("userId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'empresa_config_userId_fkey'
  ) THEN
    ALTER TABLE "empresa_config" ADD CONSTRAINT "empresa_config_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;