-- Expand foundation for CRM + ERP light roadmap

ALTER TABLE "oportunidades"
ADD COLUMN     "proximaAcaoEm" TIMESTAMP(3),
ADD COLUMN     "canalProximaAcao" TEXT,
ADD COLUMN     "responsavelProximaAcao" TEXT,
ADD COLUMN     "lembreteProximaAcao" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "pedidos"
ADD COLUMN     "totalBruto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalDesconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiquido" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "followup_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "titulo" TEXT,
    "mensagem" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followup_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "followup_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oportunidadeId" TEXT NOT NULL,
    "templateId" TEXT,
    "canal" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "resultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followup_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "produtos_servicos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'servico',
    "descricao" TEXT,
    "precoPadrao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_servicos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoServicoId" TEXT,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contas_receber" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "oportunidadeId" TEXT,
    "descricao" TEXT,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "valorRecebido" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataVencimento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_receber_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimentos_financeiros" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contaReceberId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'entrada',
    "valor" DOUBLE PRECISION NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentos_financeiros_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'vendedor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contas_receber_pedidoId_key" ON "contas_receber"("pedidoId");
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

CREATE INDEX "followup_templates_userId_etapa_canal_ativo_idx" ON "followup_templates"("userId", "etapa", "canal", "ativo");
CREATE INDEX "followup_attempts_userId_oportunidadeId_createdAt_idx" ON "followup_attempts"("userId", "oportunidadeId", "createdAt");
CREATE INDEX "produtos_servicos_userId_ativo_idx" ON "produtos_servicos"("userId", "ativo");
CREATE INDEX "pedido_itens_userId_pedidoId_idx" ON "pedido_itens"("userId", "pedidoId");
CREATE INDEX "pedido_itens_pedidoId_idx" ON "pedido_itens"("pedidoId");
CREATE INDEX "contas_receber_userId_status_dataVencimento_idx" ON "contas_receber"("userId", "status", "dataVencimento");
CREATE INDEX "contas_receber_userId_createdAt_idx" ON "contas_receber"("userId", "createdAt");
CREATE INDEX "movimentos_financeiros_userId_dataMovimento_idx" ON "movimentos_financeiros"("userId", "dataMovimento");
CREATE INDEX "movimentos_financeiros_contaReceberId_idx" ON "movimentos_financeiros"("contaReceberId");
CREATE INDEX "workspaces_ownerId_idx" ON "workspaces"("ownerId");
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

ALTER TABLE "followup_templates" ADD CONSTRAINT "followup_templates_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "followup_attempts" ADD CONSTRAINT "followup_attempts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "followup_attempts" ADD CONSTRAINT "followup_attempts_oportunidadeId_fkey"
FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "followup_attempts" ADD CONSTRAINT "followup_attempts_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "followup_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "produtos_servicos" ADD CONSTRAINT "produtos_servicos_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedidoId_fkey"
FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produtoServicoId_fkey"
FOREIGN KEY ("produtoServicoId") REFERENCES "produtos_servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_pedidoId_fkey"
FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_oportunidadeId_fkey"
FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "movimentos_financeiros" ADD CONSTRAINT "movimentos_financeiros_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movimentos_financeiros" ADD CONSTRAINT "movimentos_financeiros_contaReceberId_fkey"
FOREIGN KEY ("contaReceberId") REFERENCES "contas_receber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
