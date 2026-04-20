# AGENTS.md

Fonte unica de regras para agentes de IA (Cursor, Codex e equivalentes) operando neste repositorio. Mantenha este arquivo curto. Detalhes longos vivem em `STRUCTURE.md`, `DATABASE.md`, `SECURITY.md`, `DEPLOY.md`, `colors.MD` e `docs/agent/`.

## 1. Escopo e stack

- CRM web em Next.js 16 (App Router), React 19, Tailwind 4, Prisma 7, PostgreSQL (Supabase), NextAuth, Stripe, Resend, Sentry.
- Visao completa do codigo: [STRUCTURE.md](STRUCTURE.md). Mapa rapido "tarefa -> arquivos": [AGENT_INDEX.md](AGENT_INDEX.md).

## 2. Como ler este repositorio (token budget)

Operar em 4 camadas, nesta ordem:

1. Layer 0 (sempre): `AGENTS.md` + `AGENT_INDEX.md`. Total <= 300 linhas.
2. Layer 1 (auto por glob no Cursor): `.cursor/rules/*.mdc`. Nao carregar manualmente.
3. Layer 2 (sob demanda): `STRUCTURE.md`, `DATABASE.md`, `SECURITY.md`, `DEPLOY.md`, `AUTOMACAO.md`, `colors.MD`, `docs/agent/SPEC_AND_HARNESS.md`, `docs/agent/GLOSSARY.md`, `docs/agent/RECIPES.md`, `docs/agent/MCP.md`.
4. Layer 3 (codigo real): usar `Grep`/`Glob` antes de `Read` em qualquer arquivo > 300 linhas.

### Spec-driven development e Harness Engineering

- Trabalhar em ciclo **Spec → Mapear (AGENT_INDEX) → Implementar minimo → Verificar (aceite + `npm run check`)**. A spec deve ter criterios de aceite verificaveis antes de codar mudancas grandes.
- **Harness** = regras do repo (AGENTS, AGENT_INDEX, `.cursor/rules`, RECIPES, smoke). Manter o harness atualizado quando um padrao novo se tornar obrigatorio.
- Guia operacional: [docs/agent/SPEC_AND_HARNESS.md](docs/agent/SPEC_AND_HARNESS.md). Workflow curto: [.agent/workflows/spec-harness-task.md](.agent/workflows/spec-harness-task.md).

Regras de economia:
- Ao receber uma tarefa, seguir o **Protocolo por mensagem** em [AGENT_INDEX.md](AGENT_INDEX.md) (uma categoria da tabela, leitura minima).
- Nao duplicar contexto. Se uma rule Cursor ja foi carregada para o glob em questao, nao releia a mesma secao de `AGENTS.md`.
- Nao colar exemplos longos em resposta quando `docs/agent/RECIPES.md` cobre o caso.
- Consultar MCP `context7` antes de especular sobre APIs da stack.

## 3. Politica de MCPs

Referencia completa: [docs/agent/MCP.md](docs/agent/MCP.md).

- `context7`: docs de stack (Next 16, React 19, Prisma 7, Tailwind 4, NextAuth, Stripe). Primeira parada em duvidas de API.
- `prisma`: introspeccao do schema e validacao de migrations.
- `supabase`: leitura/diagnostico no banco real. Nunca executar mutations destrutivas em producao.
- `next-devtools`: debug runtime do App Router.
- `resend` (apenas Cursor): preview e envio de emails.

Quando NAO usar MCP: perguntas triviais, refatoracao local, leitura de codigo proprio.

## 4. Arquitetura

### Feature-first

Cada feature do CRM vive em `components/features/<feature>/`:

```
types.ts         interfaces e tipos locais
constants.ts     labels, enums, mapas de cor
utils.ts         funcoes puras (formatacao, calculos)
hooks/useX.ts    estado e chamadas de API (TanStack Query; ver lib/query/fetch-json.ts)
*.tsx            componentes de apresentacao
index.ts         barrel export
```

Referencia ja modular: [components/features/pedidos/](components/features/pedidos/) + [app/pedidos/page.tsx](app/pedidos/page.tsx).

### Limites de tamanho

- `app/**/page.tsx`: ate 300 linhas. So orquestracao de hooks e componentes.
- Componentes isolados: ate 250 linhas.
- Hooks customizados: ate 200 linhas.
- Acima disso, refatorar antes de adicionar funcionalidades (excecao: arquivos-registro intencionais).

### Separacao de responsabilidades

- `page.tsx` nao faz fetch direto nem contem logica de dominio.
- Chamadas de API vivem em hooks de `components/features/<feature>/hooks/` ou `lib/hooks/`.
- Tipos compartilhados da feature: `types.ts`. Tipos globais: `types/`.
- Constantes/labels: `constants.ts`. Funcoes puras: `utils.ts`.
- Componentes de apresentacao recebem dados via props.

## 5. API e seguranca

Regra base para toda rota em `app/api/**/route.ts`:

1. Extrair identidade com `getUserIdFromRequest` de [lib/auth.ts](lib/auth.ts). Sem `userId` -> 401.
2. Aplicar rate limit com `enforceApiRateLimit` de [lib/security/api-rate-limit.ts](lib/security/api-rate-limit.ts) em rotas de escrita.
3. Validar input (body, query, params) com Zod. Erros -> 400.
4. Escopar toda query Prisma por `userId` (multi-tenant). Nunca retornar dados de outro usuario.
5. Registrar eventos de negocio relevantes com `logBusinessEvent` de [lib/observability/audit.ts](lib/observability/audit.ts).
6. Respeitar edicao OSS: ver `NEXT_PUBLIC_CRM_EDITION` e `lib/crmEdition.ts`. Rotas fora do escopo publico -> 403. Detalhes em [SECURITY.md](SECURITY.md).

Receita completa: [docs/agent/RECIPES.md#api-route](docs/agent/RECIPES.md).

## 6. UI

- **Mobile vs desktop**: breakpoint de layout operacional = `lg` (1024px). Abaixo de `lg`, priorizar listas em cards ou layouts empilhados; em `lg` e acima, manter tabelas/grids densos como no desktop (sem mudar hierarquia visual legada nesse intervalo).
- Densidade compacta em listas, tabelas e cards operacionais. Evitar empilhar linhas repetitivas (ex.: parcelas) sem agrupamento.
- Cores seguem [colors.MD](colors.MD). Suportar tema claro e escuro (`dark:` prefix).
- Feedback: usar `toast` de [lib/toast.ts](lib/toast.ts) (wrapper de Sonner). SweetAlert2 apenas em telas legadas que ja o utilizam.
- Confirmacoes destrutivas: `ConfirmDialog` de [components/common/](components/common/).

## 7. Dados (Prisma / Supabase)

- Sempre trabalhar com migrations: `npm run db:migrate` (dev) e `npm run db:deploy` (prod).
- NAO usar `prisma db push` fora de prototipagem descartavel.
- Apos editar [prisma/schema.prisma](prisma/schema.prisma), rodar nesta ordem: `npm run db:generate` e `npm run db:deploy` (ou `db:migrate` em dev com nome).
- Conexoes: `DATABASE_URL` (pooler) + `DIRECT_URL` (migrations). Ver [DATABASE.md](DATABASE.md).
- Aritmetica monetaria: sempre via [lib/money.ts](lib/money.ts) (`roundMoney`, `sumMoney`, `moneyRemaining`). Nunca usar `+`, `*` direto em valores financeiros.
- Formatacao humana: [lib/format.ts](lib/format.ts) (`formatCurrency`, `formatDate`, `formatMonthLabel`).

## 8. Validacao antes de encerrar

Para qualquer alteracao de codigo:

```powershell
npm run check   # lint + type-check + smoke de API
```

Para mudancas de schema Prisma, somar:

```powershell
npm run db:generate
npm run db:deploy   # ou db:migrate em dev
```

Reportar ao final: comandos executados e resultado (sucesso/falha). Ver [.agent/workflows/run-checks.md](.agent/workflows/run-checks.md).

## 9. Execucao automatica de comandos

- Rodar no terminal, sem pedir confirmacao, quando a tarefa exigir validacao tecnica: `build`, `type-check`, `lint`, `test:smoke`, `db:generate`, `db:migrate`, `db:deploy`, `db:status`.
- Em Windows usar PowerShell. Scripts npm compativeis: usar `npm run <script>` (o `dev` ja invoca `kill-ports.ps1` automaticamente).

## 10. NAO FAZER

- Nao commitar `.env`, chaves, secrets, connection strings.
- Nao usar `prisma db push` para alterar producao ou substituir migrations.
- Nao criar rota em `app/api/**` sem `userId` + Zod + rate limit.
- Nao criar componente > 250 linhas sem justificativa; se for pagina, > 300 linhas.
- Nao fazer fetch dentro de `page.tsx` ou dentro de componentes de apresentacao.
- Nao somar/multiplicar valores monetarios com operadores nativos (`+`, `*`); use `lib/money.ts`.
- Nao usar SweetAlert2 em telas novas. Padrao = `toast` do Sonner via `lib/toast.ts`.
- Nao duplicar paleta: todas as cores partem de [colors.MD](colors.MD) / `app/globals.css`.
- Nao colar blocos longos de documentacao na resposta quando um link resolve.

## 11. Guardrails de token-budget (obrigatorios)

- Antes de `Read` em arquivo > 300 linhas, usar `Grep`/`Glob` para localizar o trecho.
- Nao recarregar `STRUCTURE.md` inteiro; usar `AGENT_INDEX.md` como mapa e ler so a secao necessaria.
- Nao duplicar o conteudo de rules `.cursor/rules/*.mdc` na resposta; elas ja estao no contexto do Cursor quando o glob bate.
- Preferir `SemanticSearch` em exploracao inicial; `Grep` para simbolos conhecidos; `Read` so depois.
- Em duvidas de API de biblioteca, primeiro `context7`, depois codigo local.
- Agrupar tool calls independentes em paralelo sempre que nao houver dependencia entre elas.
- Reutilizar resultados ja obtidos no mesmo turno; nao repetir buscas identicas.
- Nao pedir confirmacao para leitura segura; pedir apenas para acoes destrutivas ou decisoes com ambiguidade real.
- Respostas ao usuario: curtas, objetivas, em portugues, sem repetir o plano ja aceito.
