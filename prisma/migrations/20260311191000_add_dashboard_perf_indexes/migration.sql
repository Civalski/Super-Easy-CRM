-- Add query-oriented indexes to reduce dashboard and finance API latency.
CREATE INDEX IF NOT EXISTS "contatos_userId_createdAt_idx"
ON "contatos"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "oportunidades_userId_createdAt_idx"
ON "oportunidades"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "oportunidades_userId_status_updatedAt_idx"
ON "oportunidades"("userId", "status", "updatedAt");

CREATE INDEX IF NOT EXISTS "pedidos_userId_pagamentoConfirmado_idx"
ON "pedidos"("userId", "pagamentoConfirmado");

CREATE INDEX IF NOT EXISTS "tarefas_userId_createdAt_idx"
ON "tarefas"("userId", "createdAt");
