# Estrutura do Projeto — Arker Easy CRM

CRM completo construído com **Next.js 16 (App Router)**, **React 19**, **Prisma 7**, **Tailwind CSS 4** e **TypeScript 5**.
Banco de dados PostgreSQL hospedado no Supabase. Autenticação via NextAuth (Credentials + JWT).
Assinatura via Mercado Pago. Deploy na Vercel.

---

## Raiz do projeto

| Arquivo / Pasta | Descrição |
|---|---|
| `app/` | Rotas do Next.js (App Router). Cada subpasta é uma rota pública ou de API. |
| `components/` | Componentes React organizados por camada (`common`, `features`, `layout`, `providers`). |
| `lib/` | Lógica de servidor e utilitários compartilhados (auth, prisma, segurança, formatação, billing). |
| `prisma/` | Schema do banco, migrations e seed. |
| `scripts/` | Scripts auxiliares de CLI (setup, seed, testes, gerenciamento de usuários). |
| `types/` | Tipos TypeScript globais e extensões de módulos (ex: NextAuth). |
| `public/` | Assets estáticos servidos diretamente (logos, favicon). |
| `proxy.ts` | Middleware do Next.js 16 — protege rotas, verifica JWT, aplica RBAC. |
| `next.config.js` | Configuração do Next.js (headers, env públicas). |
| `prisma.config.ts` | Configuração de conexão do Prisma (URLs do banco). |
| `tsconfig.json` | Configuração do TypeScript. Path alias `@/*` aponta para a raiz. |
| `postcss.config.js` | Configuração do PostCSS (Tailwind). |
| `eslint.config.mjs` | Configuração do ESLint. |
| `vercel.json` | Configuração de deploy na Vercel. |
| `AGENTS.md` | Regras de arquitetura para agentes de IA. |
| `DATABASE.md` | Documentação do schema do banco de dados. |
| `AUTOMACAO.md` | Documentação das automações do sistema (recorrências, agendamentos). |
| `DEPLOY.md` | Guia de deploy e variáveis de ambiente necessárias. |

---

## `app/` — Rotas (App Router)

Cada pasta dentro de `app/` corresponde a uma rota. Arquivos `page.tsx` são páginas; arquivos `route.ts` dentro de `api/` são endpoints REST.

### Páginas (Frontend)

| Rota | Descrição |
|---|---|
| `page.tsx` | Página raiz — redireciona para login ou dashboard. |
| `layout.tsx` | Layout global (fontes, tema, providers, sidebar, notificações). |
| `Providers.tsx` | Agrupa todos os context providers (Auth, Tema). |
| `error.tsx` | Error Boundary global — captura erros não tratados. |
| `globals.css` | Estilos globais e configuração do Tailwind. |
| `login/` | Página de login com Turnstile e honeypot. |
| `register/` | Página de registro com código de convite. |
| `dashboard/` | Dashboard com estatísticas, metas, fluxo de caixa e atividades recentes. |
| `clientes/` | Listagem de clientes com paginação. |
| `clientes/[id]/` | Detalhes do cliente (info, histórico comercial, dados empresariais, edição). |
| `oportunidades/` | Gestão de orçamentos (criação, edição, carrinho de produtos, PDF). |
| `pedidos/` | Gestão de pedidos (operacional e comercial). |
| `financeiro/` | Contas a receber/pagar, fluxo de caixa, parcelas, recorrências. |
| `prospectar/` | Prospecção de leads (importação, lotes, qualificação, conversão). |
| `tarefas/` | Gestão de tarefas com notificações. |
| `metas/` | Metas comerciais (diárias, semanais, mensais, personalizadas). |
| `produtos/` | Catálogo de produtos e serviços. |
| `grupos/` | Gestão de grupos/workspaces. |
| `relatorios/` | Relatórios de funil, performance e perdas. |
| `configuracoes/` | Configurações do usuário (tema, PDF, assinatura, dados). |
| `followups/` | Templates de follow-up. |
| `suporte/` | Página de suporte. |
| `seed/` | Interface de seed para desenvolvimento. |

### API Routes (`app/api/`)

Cada `route.ts` exporta handlers HTTP (`GET`, `POST`, `PATCH`, `DELETE`). Todas as rotas autenticadas usam `getUserIdFromRequest` de `lib/auth.ts`. Isolamento multi-tenant por `userId` em todas as queries.

| Rota | Descrição |
|---|---|
| `auth/[...nextauth]/` | Handler do NextAuth (login, sessão, JWT). |
| `auth/register/` | Registro de novos usuários com código de convite. |
| `clientes/` | CRUD de clientes com paginação e histórico comercial. |
| `oportunidades/` | CRUD de orçamentos. Sub-rotas: `[id]/pdf/` (geração de PDF), `[id]/followups/`. |
| `pedidos/` | CRUD de pedidos. Sub-rota: `[id]/itens/` (itens do pedido). |
| `financeiro/contas-receber/` | CRUD de contas financeiras (receber/pagar, parcelas, recorrências). |
| `financeiro/fluxo-caixa/` | Fluxo de caixa com projeção de 6 meses. |
| `prospectos/` | CRUD de prospectos. Sub-rotas: `converter/`, `qualificar/`, `promover/`, `importar/`, `bulk/`, `agendamentos/`. |
| `tarefas/` | CRUD de tarefas. |
| `metas/` | CRUD de metas com cálculo de progresso. Helper: `helpers.ts`. |
| `produtos-servicos/` | CRUD de produtos/serviços. Sub-rota: `busca/` (autocomplete). |
| `pessoas/busca/` | Busca unificada de clientes e prospectos (para selects). |
| `busca/` | Busca global (header). |
| `dashboard/` | Dados do dashboard e atividades recentes. |
| `notificacoes/` | Notificações do usuário. |
| `motivos-perda/` | Motivos de perda de oportunidades. |
| `configuracoes/pdf/` | Configuração de layout do PDF de orçamentos. |
| `grupos/` | Gestão de workspaces. |
| `notas/` | Notas em bloco e templates de email/WhatsApp. |
| `relatorios/` | Relatórios: `funil/`, `performance/`, `perdas/`. Compartilham `_shared.ts`. |
| `billing/mercado-pago/` | `subscription/` (criar/consultar assinatura), `webhook/` (receber eventos). |
| `seed/` | Seed de dados para desenvolvimento. `clear/` limpa dados do usuário. |

---

## `components/` — Componentes React

Organizados em 4 camadas:

### `components/common/`

Componentes reutilizáveis genéricos, sem lógica de negócio.

| Componente | Descrição |
|---|---|
| `Button.tsx` | Botão com variantes (primary, outline, danger, secondary) e tamanhos. |
| `AsyncSelect.tsx` | Select com busca assíncrona via API (usado para clientes, produtos). |
| `MultiSelect.tsx` | Select com múltipla seleção. |
| `SideCreateDrawer.tsx` | Drawer lateral para formulários de criação/edição. |
| `StatCard.tsx` | Card de estatísticas. |
| `ConfirmDialog.tsx` | Diálogo de confirmação modal. |

### `components/features/`

Componentes organizados por feature do CRM. Cada feature segue a estrutura:

```
components/features/<feature>/
├── types.ts         — Interfaces e tipos locais
├── constants.ts     — Constantes, labels, mapas de valores
├── utils.ts         — Funções puras (formatação, cálculos)
├── hooks/           — Hooks customizados (estado, chamadas de API)
├── *.tsx            — Componentes de apresentação
└── index.ts         — Barrel exports
```

| Feature | Descrição |
|---|---|
| `clientes/` | Tabela de clientes, header, empty state. Subpasta `detalhes/` com cards de info, histórico, edição. |
| `oportunidades/` | Lista de orçamentos, drawers de criação/edição, carrinho de produtos. |
| `pedidos/` | Lista de pedidos, tabs, filtros, drawer de edição, modal de itens. |
| `financeiro/` | Fluxo de caixa, lista de contas, modais de criação/edição. |
| `prospectar/` | Cards de prospectos, filtros, estatísticas, modal de observações. |
| `tarefas/` | Grid de tarefas, tabs, filtros, notificações. |
| `dashboard/` | Charts, metas, atividades recentes, stats grid. |
| `configuracoes/` | Cards de configuração (tema, PDF, assinatura, seed, preferências). |
| `leads/` | Meta de contato diária. |
| `register/` | Formulário de registro, hero, checkout. |
| `relatorios/` | Header e empty state de relatórios. |

### `components/layout/`

Componentes estruturais da interface.

| Componente | Descrição |
|---|---|
| `Layout.tsx` | Layout principal com sidebar e área de conteúdo. |
| `Sidebar.tsx` | Menu lateral com navegação, status premium, info do usuário. |
| `Header.tsx` | Barra superior com busca global, notificações, configurações. |
| `NotificationDropdown.tsx` | Dropdown de notificações no header. |
| `SearchResultsDropdown.tsx` | Dropdown de resultados da busca global. |

### `components/providers/`

| Componente | Descrição |
|---|---|
| `AuthProvider.tsx` | Wrapper do `SessionProvider` do NextAuth. |

---

## `lib/` — Lógica compartilhada

| Arquivo / Pasta | Descrição |
|---|---|
| `auth.ts` | `getUserIdFromRequest` e `getAuthIdentityFromRequest` — extração de identidade via JWT. |
| `prisma.ts` | Singleton do Prisma Client com adapter PostgreSQL. |
| `nextauth-secret.ts` | Resolução do secret do NextAuth (env ou fallback em dev). |
| `format.ts` | Funções centralizadas de formatação: `formatCurrency`, `formatDate`, `formatMonthLabel`, etc. |
| `money.ts` | Aritmética monetária segura: `roundMoney`, `moneyRemaining`, `sumMoney`. |
| `security/` | Rate limiting (`rate-limit.ts`, `api-rate-limit.ts`), Turnstile (`turnstile.ts`), IP extraction (`client-ip.ts`), heavy routes guard (`heavy-routes.ts`). |
| `billing/` | Integração com Mercado Pago: `mercado-pago.ts` (API, webhook HMAC), `subscription-access.ts` (verificação de acesso premium), `subscription-schema.ts` (detecção de schema). |
| `domain/` | Lógica de domínio: `probabilidade.ts` (níveis e badges), `status.ts` (mapeamento de status de oportunidades). |
| `hooks/` | Hooks globais: `useDashboardData.ts` (SWR), `useGlobalSearch.ts` (busca com debounce e cache), `useMotivosPerda.ts`. |
| `ui/` | Preferências de UI persistidas em localStorage: tema, sidebar, formato de data, densidade, confirmação de exclusão. |
| `observability/` | `audit.ts` — log estruturado de eventos de negócio. |
| `financeiro/` | `automation.ts` — lógica de automação financeira (recorrências). |
| `pedidos/` | `totals.ts` — cálculo de totais de pedidos. |
| `prospectos/` | `enviarAoFunil.ts` — lógica de envio de prospectos ao funil. |

---

## `prisma/` — Banco de dados

| Arquivo | Descrição |
|---|---|
| `schema.prisma` | Schema completo do banco: 20+ modelos (User, Cliente, Oportunidade, Pedido, ContaReceber, Prospecto, etc.). |
| `seed.ts` | Script de seed para popular dados de teste. |
| `migrations/` | Histórico de migrations SQL. |

---

## `scripts/` — Utilitários de CLI

| Script | Descrição |
|---|---|
| `setup-dev.js` | Prepara ambiente de desenvolvimento (copia .env, etc.). |
| `setup-prod.js` | Prepara ambiente de produção. |
| `seed-registration-codes.js` | Gera códigos de convite para registro. |
| `create-user.js` | Cria usuário diretamente no banco. |
| `list-users.js` | Lista usuários cadastrados. |
| `reset-user-password.js` | Reseta senha de um usuário. |
| `test-db.js` | Testa conexão com o banco de dados. |
| `smoke-api-guards.js` | Testa se as rotas de API exigem autenticação. |
| `kill-ports.ps1` | Encerra processos nas portas 3000/5000 (Windows). |

---

## `types/` — Tipos globais

| Arquivo | Descrição |
|---|---|
| `next-auth.d.ts` | Extensão dos tipos do NextAuth (Session, User, JWT com `id`, `role`, `username`). |
| `dashboard.ts` | Tipos do dashboard (estatísticas, metas, atividades). |
| `leads.ts` | Tipos de importação de leads (formato Parquet/Excel). |
| `notifications.ts` | Tipos de notificações. |
| `reports.ts` | Tipos de relatórios. |
