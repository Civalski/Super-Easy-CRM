-- Harden multi-tenant relations with composite foreign keys where compatible
-- and add indexes aligned with high-frequency CRM queries.

-- 1) Composite unique indexes required by composite relations
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_id_userId_key" ON "clientes"("id", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "oportunidades_id_userId_key" ON "oportunidades"("id", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "pedidos_id_userId_key" ON "pedidos"("id", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "pedidos_oportunidadeId_userId_key" ON "pedidos"("oportunidadeId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "prospectos_clienteId_userId_key" ON "prospectos"("clienteId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "followup_templates_id_userId_key" ON "followup_templates"("id", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "produtos_servicos_id_userId_key" ON "produtos_servicos"("id", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "contas_receber_id_userId_key" ON "contas_receber"("id", "userId");

-- 2) Query-oriented indexes
CREATE INDEX IF NOT EXISTS "clientes_userId_createdAt_idx" ON "clientes"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "oportunidades_userId_status_createdAt_idx" ON "oportunidades"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "pedidos_userId_createdAt_idx" ON "pedidos"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "tarefas_userId_status_prioridade_createdAt_idx" ON "tarefas"("userId", "status", "prioridade", "createdAt");
CREATE INDEX IF NOT EXISTS "prospectos_userId_status_createdAt_idx" ON "prospectos"("userId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "contas_receber_userId_grupoParcelaId_idx" ON "contas_receber"("userId", "grupoParcelaId");
CREATE INDEX IF NOT EXISTS "movimentos_financeiros_contaReceberId_createdAt_idx" ON "movimentos_financeiros"("contaReceberId", "createdAt");

-- 3) Replace single-column foreign keys with composite (id, userId) in tenant-scoped relations
ALTER TABLE "contatos" DROP CONSTRAINT IF EXISTS "contatos_clienteId_fkey";
ALTER TABLE "oportunidades" DROP CONSTRAINT IF EXISTS "oportunidades_clienteId_fkey";
ALTER TABLE "pedidos" DROP CONSTRAINT IF EXISTS "pedidos_oportunidadeId_fkey";
ALTER TABLE "tarefas" DROP CONSTRAINT IF EXISTS "tarefas_clienteId_fkey";
ALTER TABLE "tarefas" DROP CONSTRAINT IF EXISTS "tarefas_oportunidadeId_fkey";
ALTER TABLE "prospectos" DROP CONSTRAINT IF EXISTS "prospectos_clienteId_fkey";
ALTER TABLE "followup_attempts" DROP CONSTRAINT IF EXISTS "followup_attempts_oportunidadeId_fkey";
ALTER TABLE "pedido_itens" DROP CONSTRAINT IF EXISTS "pedido_itens_pedidoId_fkey";
ALTER TABLE "movimentos_financeiros" DROP CONSTRAINT IF EXISTS "movimentos_financeiros_contaReceberId_fkey";

ALTER TABLE "contatos"
  ADD CONSTRAINT "contatos_clienteId_userId_fkey"
  FOREIGN KEY ("clienteId", "userId")
  REFERENCES "clientes"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "oportunidades"
  ADD CONSTRAINT "oportunidades_clienteId_userId_fkey"
  FOREIGN KEY ("clienteId", "userId")
  REFERENCES "clientes"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "pedidos"
  ADD CONSTRAINT "pedidos_oportunidadeId_userId_fkey"
  FOREIGN KEY ("oportunidadeId", "userId")
  REFERENCES "oportunidades"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "tarefas"
  ADD CONSTRAINT "tarefas_clienteId_userId_fkey"
  FOREIGN KEY ("clienteId", "userId")
  REFERENCES "clientes"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "tarefas"
  ADD CONSTRAINT "tarefas_oportunidadeId_userId_fkey"
  FOREIGN KEY ("oportunidadeId", "userId")
  REFERENCES "oportunidades"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "prospectos"
  ADD CONSTRAINT "prospectos_clienteId_userId_fkey"
  FOREIGN KEY ("clienteId", "userId")
  REFERENCES "clientes"("id", "userId")
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

ALTER TABLE "followup_attempts"
  ADD CONSTRAINT "followup_attempts_oportunidadeId_userId_fkey"
  FOREIGN KEY ("oportunidadeId", "userId")
  REFERENCES "oportunidades"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "pedido_itens"
  ADD CONSTRAINT "pedido_itens_pedidoId_userId_fkey"
  FOREIGN KEY ("pedidoId", "userId")
  REFERENCES "pedidos"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "movimentos_financeiros"
  ADD CONSTRAINT "movimentos_financeiros_contaReceberId_userId_fkey"
  FOREIGN KEY ("contaReceberId", "userId")
  REFERENCES "contas_receber"("id", "userId")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
