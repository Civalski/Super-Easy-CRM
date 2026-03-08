-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'bloco',
    "titulo" TEXT,
    "descricao" TEXT,
    "conteudo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- Migrate followup_templates to notas
INSERT INTO "notas" ("id", "userId", "tipo", "titulo", "descricao", "conteudo", "createdAt", "updatedAt")
SELECT
    "id",
    "userId",
    CASE
        WHEN "canal" = 'email' THEN 'email'
        WHEN "canal" = 'whatsapp' THEN 'whatsapp'
        ELSE 'whatsapp'
    END,
    "titulo",
    "etapa" || ' - ' || "canal",
    "mensagem",
    "createdAt",
    "updatedAt"
FROM "followup_templates";

-- Add notaId to followup_attempts
ALTER TABLE "followup_attempts" ADD COLUMN "notaId" TEXT;

-- Migrate templateId to notaId (same id, templates became notas)
UPDATE "followup_attempts" SET "notaId" = "templateId" WHERE "templateId" IS NOT NULL;

-- Drop templateId FK and column
ALTER TABLE "followup_attempts" DROP CONSTRAINT IF EXISTS "followup_attempts_templateId_fkey";
ALTER TABLE "followup_attempts" DROP COLUMN "templateId";

-- Add notaId FK
ALTER TABLE "notas" ADD CONSTRAINT "notas_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "followup_attempts" ADD CONSTRAINT "followup_attempts_notaId_fkey"
FOREIGN KEY ("notaId") REFERENCES "notas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop followup_templates
DROP TABLE "followup_templates";

-- CreateIndex
CREATE UNIQUE INDEX "notas_id_userId_key" ON "notas"("id", "userId");
CREATE INDEX "notas_userId_tipo_idx" ON "notas"("userId", "tipo");
