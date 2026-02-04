-- Add userId columns (nullable for backfill)
ALTER TABLE "ambientes" ADD COLUMN "userId" TEXT;
ALTER TABLE "clientes" ADD COLUMN "userId" TEXT;
ALTER TABLE "contatos" ADD COLUMN "userId" TEXT;
ALTER TABLE "oportunidades" ADD COLUMN "userId" TEXT;
ALTER TABLE "tarefas" ADD COLUMN "userId" TEXT;
ALTER TABLE "prospectos" ADD COLUMN "userId" TEXT;

-- Backfill userId using the first user in the database
UPDATE "ambientes"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "clientes"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "contatos"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "oportunidades"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "tarefas"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "prospectos"
SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "userId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "ambientes" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "clientes" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "contatos" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "oportunidades" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "tarefas" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "prospectos" ALTER COLUMN "userId" SET NOT NULL;

-- Drop old unique indexes
DROP INDEX IF EXISTS "clientes_email_key";
DROP INDEX IF EXISTS "prospectos_cnpj_key";

-- Indexes for userId
CREATE INDEX "ambientes_userId_idx" ON "ambientes"("userId");
CREATE INDEX "clientes_userId_idx" ON "clientes"("userId");
CREATE INDEX "contatos_userId_idx" ON "contatos"("userId");
CREATE INDEX "oportunidades_userId_idx" ON "oportunidades"("userId");
CREATE INDEX "tarefas_userId_idx" ON "tarefas"("userId");
CREATE INDEX "prospectos_userId_idx" ON "prospectos"("userId");

-- Unique constraints per user
CREATE UNIQUE INDEX "clientes_userId_email_key" ON "clientes"("userId", "email");
CREATE UNIQUE INDEX "prospectos_userId_cnpj_key" ON "prospectos"("userId", "cnpj");

-- Foreign keys to users
ALTER TABLE "ambientes" ADD CONSTRAINT "ambientes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clientes" ADD CONSTRAINT "clientes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contatos" ADD CONSTRAINT "contatos_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prospectos" ADD CONSTRAINT "prospectos_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
