-- Harden ContaReceber tenant-scoped relations and clean legacy cross-tenant links.

CREATE UNIQUE INDEX IF NOT EXISTS "fornecedores_id_userId_key"
ON "fornecedores"("id", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "funcionarios_id_userId_key"
ON "funcionarios"("id", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "contas_receber_pedidoId_userId_key"
ON "contas_receber"("pedidoId", "userId");

CREATE INDEX IF NOT EXISTS "contas_receber_userId_fornecedorId_idx"
ON "contas_receber"("userId", "fornecedorId");

CREATE INDEX IF NOT EXISTS "contas_receber_userId_funcionarioId_idx"
ON "contas_receber"("userId", "funcionarioId");

UPDATE "contas_receber" cr
SET "pedidoId" = NULL
WHERE cr."pedidoId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "pedidos" p
    WHERE p."id" = cr."pedidoId"
      AND p."userId" = cr."userId"
  );

UPDATE "contas_receber" cr
SET "oportunidadeId" = NULL
WHERE cr."oportunidadeId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "oportunidades" o
    WHERE o."id" = cr."oportunidadeId"
      AND o."userId" = cr."userId"
  );

UPDATE "contas_receber" cr
SET "fornecedorId" = NULL
WHERE cr."fornecedorId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "fornecedores" f
    WHERE f."id" = cr."fornecedorId"
      AND f."userId" = cr."userId"
  );

UPDATE "contas_receber" cr
SET "funcionarioId" = NULL
WHERE cr."funcionarioId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "funcionarios" f
    WHERE f."id" = cr."funcionarioId"
      AND f."userId" = cr."userId"
  );

ALTER TABLE "contas_receber" DROP CONSTRAINT IF EXISTS "contas_receber_pedidoId_fkey";
ALTER TABLE "contas_receber" DROP CONSTRAINT IF EXISTS "contas_receber_oportunidadeId_fkey";
ALTER TABLE "contas_receber" DROP CONSTRAINT IF EXISTS "contas_receber_fornecedorId_fkey";
ALTER TABLE "contas_receber" DROP CONSTRAINT IF EXISTS "contas_receber_funcionarioId_fkey";

ALTER TABLE "contas_receber"
  ADD CONSTRAINT "contas_receber_pedidoId_userId_fkey"
  FOREIGN KEY ("pedidoId", "userId")
  REFERENCES "pedidos"("id", "userId")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "contas_receber"
  ADD CONSTRAINT "contas_receber_oportunidadeId_userId_fkey"
  FOREIGN KEY ("oportunidadeId", "userId")
  REFERENCES "oportunidades"("id", "userId")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "contas_receber"
  ADD CONSTRAINT "contas_receber_fornecedorId_userId_fkey"
  FOREIGN KEY ("fornecedorId", "userId")
  REFERENCES "fornecedores"("id", "userId")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "contas_receber"
  ADD CONSTRAINT "contas_receber_funcionarioId_userId_fkey"
  FOREIGN KEY ("funcionarioId", "userId")
  REFERENCES "funcionarios"("id", "userId")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
