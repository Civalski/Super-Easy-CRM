-- Add indexes to cover foreign keys for better query performance (Supabase advisor).
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

-- goals: userId FK
CREATE INDEX IF NOT EXISTS "goals_userId_idx" ON "goals"("userId");

-- registration_codes: usedById FK
CREATE INDEX IF NOT EXISTS "registration_codes_usedById_idx" ON "registration_codes"("usedById");

-- contatos: (clienteId, userId) FK
CREATE INDEX IF NOT EXISTS "contatos_clienteId_userId_idx" ON "contatos"("clienteId", "userId");

-- oportunidades: (clienteId, userId) FK
CREATE INDEX IF NOT EXISTS "oportunidades_clienteId_userId_idx" ON "oportunidades"("clienteId", "userId");

-- tarefas: (clienteId, userId) and (oportunidadeId, userId) FKs
CREATE INDEX IF NOT EXISTS "tarefas_clienteId_userId_idx" ON "tarefas"("clienteId", "userId");
CREATE INDEX IF NOT EXISTS "tarefas_oportunidadeId_userId_idx" ON "tarefas"("oportunidadeId", "userId");

-- followup_attempts: (oportunidadeId, userId) and notaId FKs
CREATE INDEX IF NOT EXISTS "followup_attempts_oportunidadeId_userId_idx" ON "followup_attempts"("oportunidadeId", "userId");
CREATE INDEX IF NOT EXISTS "followup_attempts_notaId_idx" ON "followup_attempts"("notaId");

-- pedido_itens: (pedidoId, userId) and produtoServicoId FKs
CREATE INDEX IF NOT EXISTS "pedido_itens_pedidoId_userId_idx" ON "pedido_itens"("pedidoId", "userId");
CREATE INDEX IF NOT EXISTS "pedido_itens_produtoServicoId_idx" ON "pedido_itens"("produtoServicoId");

-- contas_receber: (oportunidadeId, userId), (fornecedorId, userId), (funcionarioId, userId), (clienteId, userId) FKs
CREATE INDEX IF NOT EXISTS "contas_receber_oportunidadeId_userId_idx" ON "contas_receber"("oportunidadeId", "userId");
CREATE INDEX IF NOT EXISTS "contas_receber_fornecedorId_userId_idx" ON "contas_receber"("fornecedorId", "userId");
CREATE INDEX IF NOT EXISTS "contas_receber_funcionarioId_userId_idx" ON "contas_receber"("funcionarioId", "userId");
CREATE INDEX IF NOT EXISTS "contas_receber_clienteId_userId_idx" ON "contas_receber"("clienteId", "userId");

-- movimentos_financeiros: (contaReceberId, userId) FK
CREATE INDEX IF NOT EXISTS "movimentos_financeiros_contaReceberId_userId_idx" ON "movimentos_financeiros"("contaReceberId", "userId");
