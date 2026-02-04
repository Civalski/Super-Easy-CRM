-- CreateTable
CREATE TABLE "motivos_perda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motivos_perda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "motivos_perda_userId_idx" ON "motivos_perda"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "motivos_perda_userId_nome_key" ON "motivos_perda"("userId", "nome");

-- AddForeignKey
ALTER TABLE "motivos_perda" ADD CONSTRAINT "motivos_perda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
