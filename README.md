# Arker Easy CRM

CRM web para gestão comercial: oportunidades, pedidos, financeiro, metas, produtos, prospecção, integrações e demais módulos operacionais em uma única aplicação.

## O que inclui

- Funil e grupos de vendas, oportunidades, clientes e tarefas
- Pedidos, financeiro, metas, catálogo de produtos e fluxos de prospecção
- Autenticação (NextAuth + Supabase), e-mail (Resend), pagamentos (Stripe), observabilidade (Sentry)

## Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **UI:** React 19, [Tailwind CSS](https://tailwindcss.com/) 4
- **Banco:** PostgreSQL com [Prisma](https://www.prisma.io/) 7
- **Auth:** [NextAuth.js](https://next-auth.js.org/) e [Supabase](https://supabase.com/) (ex.: login com Google)
- **Outros:** TanStack Query, Stripe, Resend, Sentry

## Pré-requisitos

- Node.js (versão compatível com o projeto; recomendado LTS atual)
- npm
- Instância PostgreSQL (ex.: [Supabase](https://supabase.com/) ou outro provedor)
- No Windows, o script de desenvolvimento usa **PowerShell** para liberar portas antes do `next dev`

## Configuração rápida

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` ou `.env.local` na raiz. Use [.env.example](./.env.example) como referência de nomes de variáveis e consulte [SECURITY.md](./SECURITY.md) para boas práticas. **Não commite segredos.**

   Variáveis centrais:

   - `DATABASE_URL` — connection string PostgreSQL (pooler)
   - `DIRECT_URL` — connection string direta (recomendado para migrations com Prisma)
   - `NEXTAUTH_URL` e `NEXTAUTH_SECRET`
   - Supabase (quando usar auth/storage): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`), e opcionalmente `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_AUTH_EMAIL_REDIRECT_URL`

   Detalhes de produção e deploy: [DEPLOY.md](./DEPLOY.md).

3. Ajuste o schema e gere o cliente Prisma:

   ```bash
   npm run setup:dev
   ```

4. Aplique migrations e, se quiser, o seed:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Na primeira execução, você pode usar `npm run dev:first`, que roda `setup:dev` antes do frontend.

## Edição limitada no build (opcional)

Para um build que expõe apenas funil de vendas (`/grupos`, `/oportunidades`), clientes e tarefas — com redirecionamento das demais rotas e **403** nas APIs fora do escopo — defina no **momento do build**:

`NEXT_PUBLIC_CRM_EDITION=oss`

Para a aplicação **completa** (todos os módulos), **não** defina essa variável ou deixe-a vazia.

## Scripts npm

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento (Next.js) |
| `npm run dev:first` | Setup dev + desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript sem emitir arquivos |
| `npm run check` | lint + type-check + teste de smoke da API |
| `npm run db:generate` | `prisma generate` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Executa o seed definido no Prisma |

Outros scripts utilitários estão em [package.json](./package.json).

## Estrutura do código

- Rotas e páginas em `app/`
- Features em `components/features/<nome>/` (tipos, constantes, utils, hooks e componentes)
- Convenções para contribuição e agentes: [AGENTS.md](./AGENTS.md)

## Deploy

Vercel, variáveis de ambiente, migrations e cron financeiro: [DEPLOY.md](./DEPLOY.md).

## Licença

Projeto privado (open source reduzido) (`private: true` no `package.json`).
