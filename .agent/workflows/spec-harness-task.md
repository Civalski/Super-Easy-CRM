---
description: Fluxo spec-driven + harness para qualquer tarefa de codigo (Spec → Mapear → Implementar → Verificar)
---

# Tarefa com Spec-driven development e Harness

## 1. Spec (antes de codar)

Escrever ou confirmar com o usuario uma spec minima:

- Objetivo (1 frase), fora de escopo, **criterios de aceite verificaveis**, arquivos/areas previstas.
- Seguranca: multi-tenant, rate limit, dinheiro (`lib/money.ts`), edicao OSS se aplicavel.

Template: [docs/agent/SPEC_AND_HARNESS.md](../../docs/agent/SPEC_AND_HARNESS.md) (secao “Template copiavel”).

## 2. Harness: mapear contexto

- Achar **uma** linha em [AGENT_INDEX.md](../../AGENT_INDEX.md).
- Ler so a coluna “Consultar” dessa linha + trechos da spec.
- Usar [docs/agent/RECIPES.md](../../docs/agent/RECIPES.md) por **secao**, nao o arquivo inteiro.

## 3. Implementar

- Somente o escopo da spec; sem refatoracoes colaterais.
- Respeitar [AGENTS.md](../../AGENTS.md) e as `.cursor/rules/*.mdc` aplicaveis.

## 4. Verificar

- `npm run check`.
- Checar **cada** criterio de aceite da spec (e verificacao manual se o smoke nao cobrir).

## 5. Encerramento

- Listar: mudancas, comandos, criterios atendidos.
- Se novo padrao recorrente: atualizar RECIPES e/ou rule e/ou smoke ([SPEC_AND_HARNESS.md](../../docs/agent/SPEC_AND_HARNESS.md) “Manutencao do harness”).

Guia completo: [docs/agent/SPEC_AND_HARNESS.md](../../docs/agent/SPEC_AND_HARNESS.md).
