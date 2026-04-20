# AGENT_INDEX.md

Mapa rapido "tarefa -> o que ler". Complementa o [AGENTS.md](AGENTS.md) sem duplicar conteudo. Ler este arquivo primeiro, depois abrir so o que a tarefa exige.

## Protocolo por mensagem (cenario real)

0. Se a tarefa nao for trivial, produza ou confirme uma **spec** curta (objetivo, fora de escopo, criterios de aceite). Ver [docs/agent/SPEC_AND_HARNESS.md](docs/agent/SPEC_AND_HARNESS.md).
1. Na primeira resposta, classifique a tarefa em **uma** linha da tabela abaixo (ex.: "Criar rota de API").
2. Leia **somente** os arquivos da coluna "Consultar" para essa linha, na ordem listada.
3. Nao abra `STRUCTURE.md` inteiro; use `Grep` na secao citada ou va direto aos arquivos-alvo.
4. Nao leia `docs/agent/RECIPES.md` inteiro; abra so a secao necessaria (ex.: **API route**).
5. Abriu um arquivo coberto por glob? A rule em [.cursor/rules/](.cursor/rules/) ja entrou no contexto; nao recite o mesmo texto.

## Como usar

1. Identifique a categoria da tarefa na tabela abaixo.
2. Abra apenas os arquivos listados na coluna "Consultar".
3. Se a regra aplicavel tem um glob em [.cursor/rules/](.cursor/rules/), ela ja esta no contexto automaticamente quando voce abre o arquivo-alvo.
4. `STRUCTURE.md` e fonte de verdade da arvore; leia **so a secao** que importa (via `Grep`).

## Tabela de tarefas

| Tarefa | Consultar (ordem) | Rule Cursor aplicavel |
|---|---|---|
| Metodo completo (spec + harness por tarefa) | [docs/agent/SPEC_AND_HARNESS.md](docs/agent/SPEC_AND_HARNESS.md), [.agent/workflows/spec-harness-task.md](.agent/workflows/spec-harness-task.md), depois **uma** linha abaixo conforme o tipo de trabalho | conforme arquivos editados |
| Criar rota de API em `app/api/**` | [AGENTS.md](AGENTS.md) §5, [docs/agent/RECIPES.md](docs/agent/RECIPES.md) secao API route, [lib/auth.ts](lib/auth.ts), [lib/security/api-rate-limit.ts](lib/security/api-rate-limit.ts) | `auth-api.mdc`, `security-oss.mdc` |
| Criar/alterar feature em `components/features/<x>/` | [AGENTS.md](AGENTS.md) §4, [docs/agent/RECIPES.md](docs/agent/RECIPES.md) secao feature, [components/features/pedidos/](components/features/pedidos/) como referencia | `feature-module.mdc` |
| Criar hook de dados (TanStack Query) | [docs/agent/RECIPES.md](docs/agent/RECIPES.md) secao hook, [lib/hooks/useDashboardData.ts](lib/hooks/useDashboardData.ts) como exemplo | `hooks-data.mdc` |
| Alterar `page.tsx` | [AGENTS.md](AGENTS.md) §4, [app/pedidos/page.tsx](app/pedidos/page.tsx) como referencia | `page-orchestration.mdc` |
| Alterar `prisma/schema.prisma` | [DATABASE.md](DATABASE.md), [AGENTS.md](AGENTS.md) §7, [.agent/workflows/migrate-db.md](.agent/workflows/migrate-db.md) | `prisma-schema.mdc` |
| Mexer em valores monetarios | [lib/money.ts](lib/money.ts), [lib/format.ts](lib/format.ts), [lib/pedidos/totals.ts](lib/pedidos/totals.ts) | `money.mdc` |
| Ajustar UI / cores / tema | [colors.MD](colors.MD), [app/globals.css](app/globals.css) | `ui-colors.mdc` |
| Adicionar feedback ao usuario (toast/modal) | [lib/toast.ts](lib/toast.ts), [.agent/workflows/toast.md](.agent/workflows/toast.md) | `ui-colors.mdc` |
| Revisar seguranca / edicao OSS / RBAC | [SECURITY.md](SECURITY.md), [lib/crmEdition.ts](lib/crmEdition.ts), [lib/security/](lib/security/) | `security-oss.mdc` |
| Configurar deploy / envs | [DEPLOY.md](DEPLOY.md), [SECURITY.md](SECURITY.md), [.env.example](.env.example) | - |
| Entender automacoes (recorrencias, agendamentos) | [AUTOMACAO.md](AUTOMACAO.md), [lib/financeiro/automation.ts](lib/financeiro/automation.ts) | - |
| Rodar checks / validar antes de fechar | [.agent/workflows/run-checks.md](.agent/workflows/run-checks.md) | - |
| Gerar PDF de orcamento/proposta | [app/propostas/](app/propostas/), [docs/proposta-pdf-design-only.ts](docs/proposta-pdf-design-only.ts) | - |
| Usar MCP (context7, prisma, supabase, next-devtools, resend) | [docs/agent/MCP.md](docs/agent/MCP.md), [.agent/workflows/use-mcp.md](.agent/workflows/use-mcp.md) | - |
| Entender dominio (oportunidade, pedido, prospecto, motivo de perda...) | [docs/agent/GLOSSARY.md](docs/agent/GLOSSARY.md), [prisma/schema.prisma](prisma/schema.prisma) | - |

## Arvore resumida

| Pasta | Resumo | Detalhe |
|---|---|---|
| `app/` | Rotas (pages + API routes do App Router) | [STRUCTURE.md](STRUCTURE.md) secao `app/` |
| `components/` | `common/`, `features/`, `layout/`, `providers/`, `ui/` | [STRUCTURE.md](STRUCTURE.md) secao `components/` |
| `lib/` | Auth, Prisma, seguranca, billing, dominio, formatacao, money, observabilidade | [STRUCTURE.md](STRUCTURE.md) secao `lib/` |
| `prisma/` | Schema, migrations, seed | [DATABASE.md](DATABASE.md) |
| `scripts/` | Utilitarios CLI (setup, seed, backup, testes) | [STRUCTURE.md](STRUCTURE.md) secao `scripts/` |
| `types/` | Tipos globais e extensoes (NextAuth) | [STRUCTURE.md](STRUCTURE.md) secao `types/` |

## Comandos de uso frequente

| Objetivo | Comando |
|---|---|
| Desenvolvimento | `npm run dev` |
| Primeira execucao | `npm run dev:first` |
| Validar tudo antes de encerrar | `npm run check` |
| Type-check isolado | `npm run type-check` |
| Lint isolado | `npm run lint` |
| Gerar Prisma Client | `npm run db:generate` |
| Aplicar migrations (prod) | `npm run db:deploy` |
| Criar migration (dev) | `npm run db:migrate` |
| Status de migrations | `npm run db:status` |
| Prisma Studio | `npm run db:studio` |

## Regra de ouro de tokens

- Abriu o arquivo-alvo? A rule `.cursor/rules/*.mdc` aplicavel ja esta no contexto. Nao releia `AGENTS.md` inteiro.
- Arquivo > 300 linhas? `Grep`/`Glob` primeiro, `Read` so depois.
- Duvida de API de biblioteca da stack? MCP `context7` antes de especular.
- Nao duplicar exemplos: linkar [docs/agent/RECIPES.md](docs/agent/RECIPES.md).
