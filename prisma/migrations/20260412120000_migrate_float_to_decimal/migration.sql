-- Migrate monetary fields from DOUBLE PRECISION (Float) to DECIMAL (Numeric)
-- This preserves existing values while improving precision for financial calculations.

-- Oportunidade
ALTER TABLE "oportunidades" ALTER COLUMN "valor" TYPE DECIMAL USING "valor"::DECIMAL;
ALTER TABLE "oportunidades" ALTER COLUMN "desconto" TYPE DECIMAL USING "desconto"::DECIMAL;

-- Pedido
ALTER TABLE "pedidos" ALTER COLUMN "totalBruto" TYPE DECIMAL USING "totalBruto"::DECIMAL;
ALTER TABLE "pedidos" ALTER COLUMN "totalDesconto" TYPE DECIMAL USING "totalDesconto"::DECIMAL;
ALTER TABLE "pedidos" ALTER COLUMN "totalLiquido" TYPE DECIMAL USING "totalLiquido"::DECIMAL;

-- ProdutoServico
ALTER TABLE "produtos_servicos" ALTER COLUMN "precoPadrao" TYPE DECIMAL USING "precoPadrao"::DECIMAL;
ALTER TABLE "produtos_servicos" ALTER COLUMN "custoPadrao" TYPE DECIMAL USING "custoPadrao"::DECIMAL;
ALTER TABLE "produtos_servicos" ALTER COLUMN "comissaoPercentual" TYPE DECIMAL USING "comissaoPercentual"::DECIMAL;
ALTER TABLE "produtos_servicos" ALTER COLUMN "estoqueAtual" TYPE DECIMAL USING "estoqueAtual"::DECIMAL;
ALTER TABLE "produtos_servicos" ALTER COLUMN "estoqueMinimo" TYPE DECIMAL USING "estoqueMinimo"::DECIMAL;

-- PedidoItem
ALTER TABLE "pedido_itens" ALTER COLUMN "quantidade" TYPE DECIMAL USING "quantidade"::DECIMAL;
ALTER TABLE "pedido_itens" ALTER COLUMN "precoUnitario" TYPE DECIMAL USING "precoUnitario"::DECIMAL;
ALTER TABLE "pedido_itens" ALTER COLUMN "desconto" TYPE DECIMAL USING "desconto"::DECIMAL;
ALTER TABLE "pedido_itens" ALTER COLUMN "subtotal" TYPE DECIMAL USING "subtotal"::DECIMAL;

-- ContaReceber
ALTER TABLE "contas_receber" ALTER COLUMN "valorTotal" TYPE DECIMAL USING "valorTotal"::DECIMAL;
ALTER TABLE "contas_receber" ALTER COLUMN "valorRecebido" TYPE DECIMAL USING "valorRecebido"::DECIMAL;
ALTER TABLE "contas_receber" ALTER COLUMN "multaPorAtrasoPercentual" TYPE DECIMAL USING "multaPorAtrasoPercentual"::DECIMAL;
ALTER TABLE "contas_receber" ALTER COLUMN "multaPorAtrasoValor" TYPE DECIMAL USING "multaPorAtrasoValor"::DECIMAL;

-- MovimentoFinanceiro
ALTER TABLE "movimentos_financeiros" ALTER COLUMN "valor" TYPE DECIMAL USING "valor"::DECIMAL;
