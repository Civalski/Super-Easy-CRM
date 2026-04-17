# Spec-driven development e Harness Engineering

Este repositorio trata **spec-driven development** (decidir o que e como validar *antes* de codar) e **Harness Engineering** (o “arém” em volta do agente: regras, ferramentas, checks e limites) como um único fluxo. Objetivo: menos retrabalho, menos escopo vazando, mais repetibilidade.

## O harness neste projeto

O harness e o conjunto fixo que o agente nao improvisa:

| Camada | O que e | Onde |
|---|---|---|
| Politica global | Stack, seguranca, token budget | [AGENTS.md](../../AGENTS.md) |
| Roteamento de contexto | Uma tarefa → poucos arquivos | [AGENT_INDEX.md](../../AGENT_INDEX.md) |
| Regras por arquivo (Cursor) | Precisao sem carregar doc inteiro | [.cursor/rules/](../../.cursor/rules/) |
| Receitas e glossario | Copiar padroes corretos | [RECIPES.md](RECIPES.md), [GLOSSARY.md](GLOSSARY.md) |
| Verificacao automatica | Rede de seguranca pos-implementacao | `npm run check` (lint + types + [smoke API](../../scripts/smoke-api-guards.js)) |
| Documentacao externa pontual | API de libs da stack | MCP `context7` ([MCP.md](MCP.md)) |

**Harness Engineering** aqui significa: manter esse conjunto **coerente** (quando o padrao de codigo muda, atualizar RECIPES + rule + smoke se necessario), nao apenas escrever features.

## Ciclo spec-driven (por tarefa)

Ordem obrigatoria para trabalho que nao seja um typo de uma linha:

### 1. Spec (contrato antes do codigo)

Produzir uma spec **curta e testavel** (usuario ou agente). Deve responder:

- **Objetivo**: uma frase.
- **Fora de escopo**: o que nao sera feito nesta entrega.
- **Criterios de aceite**: lista verificavel (comportamento, erros esperados, edge cases).
- **Superficie**: rotas API, paginas, models Prisma, migrations?
- **Seguranca**: precisa `userId` em todas as queries? rate limit? edicao OSS?
- **Riscos**: dados sensiveis, dinheiro, migracao destrutiva?

Template copiavel:

```markdown
## Spec: <titulo>

### Objetivo
...

### Fora de escopo
- ...

### Criterios de aceite
- [ ] ...
- [ ] ...

### Arquivos / areas (previsto)
- `app/...` | `components/features/...` | `prisma/...`

### Seguranca e dados
- Multi-tenant: sim/nao | Rate limit: sim/nao | Money: sim/nao

### Verificacao
- [ ] `npm run check`
- [ ] (manual) ...
```

### 2. Mapear para o harness

- Localizar **uma** linha em [AGENT_INDEX.md](../../AGENT_INDEX.md) que melhor descreve a maior parte do trabalho.
- Ler **somente** os arquivos da coluna “Consultar” + o necessario da spec.
- Abrir a secao certa de [RECIPES.md](RECIPES.md), nao o arquivo inteiro.

### 3. Implementar o minimo

- Implementar **apenas** o que a spec e os criterios de aceite exigem.
- Nao refatorar arquivos nao citados na spec (harness: [AGENTS.md](../../AGENTS.md) §NAO FAZER).

### 4. Verificar contra a spec + harness

- Rodar `npm run check`.
- Percorrer **cada** item dos criterios de aceite; marcar na spec ou na resposta final.
- Se a spec pediu comportamento que o smoke nao cobre, documentar verificacao manual breve.

### 5. Encerramento

- Resumo: o que mudou, comandos executados, criterios atendidos.
- Se descobriu novo padrao obrigatorio: atualizar RECIPES ou rule (ver secao abaixo).

## Quando usar spec formal vs leve

| Cenario | Spec |
|---|---|
| Bugfix de 1 arquivo, criterio obvio | 2–3 linhas de aceite na mensagem |
| Nova API + UI + schema | Spec completa + criterios |
| Mudanca de seguranca / dinheiro / dados | Spec completa + revisao explicita de tenant e `lib/money.ts` |

## Manutencao do harness (para humanos e agentes)

Ao introduzir um padrao **novo** e recorrente:

1. Adicionar ou ajustar snippet em [RECIPES.md](RECIPES.md).
2. Se o padrao e por tipo de arquivo, criar ou editar rule em `.cursor/rules/*.mdc`.
3. Se for garantia critica (auth, tenant, dinheiro), considerar ampliar [smoke-api-guards.js](../../scripts/smoke-api-guards.js).
4. Se afeta onboarding do agente, uma linha em [AGENT_INDEX.md](../../AGENT_INDEX.md).

Isso evita que o “conhecimento” fique so no chat e se perca na proxima sessao.

## Relacao com MCP e tokens

- Spec primeiro reduz **exploracao aleatoria** (menos leitura de pastas inteiras).
- Harness (AGENT_INDEX + rules) reduz **duplicacao** de contexto.
- `context7` entra quando a spec ou o codigo exigem **contrato de biblioteca**; nao substitui a leitura das regras do repo.

Workflow rapido no agente: [.agent/workflows/spec-harness-task.md](../../.agent/workflows/spec-harness-task.md).
