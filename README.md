# Arker Easy CRM

CRM web para gestão comercial (oportunidades, pedidos, financeiro, metas, produtos, prospecção, integrações, etc.).

### Repositório público, produção completa e edição OSS

O código pode ficar em um repositório **público** sem expor segredos: use apenas variáveis de ambiente no deploy e siga [SECURITY.md](./SECURITY.md). Um modelo de referência está em [.env.example](./.env.example) (sem valores sensíveis).

- **Produção comercial (CRM completo no ar):** não defina `NEXT_PUBLIC_CRM_EDITION`, ou mantenha-a vazia. O build comporta-se como **edição completa** (todos os módulos e APIs ativos, como no ambiente hospedado pela Arker).
- **Build / demo open source:** defina `NEXT_PUBLIC_CRM_EDITION=oss` no momento do **build**. A interface e o **middleware** passam a expor somente **funil de vendas** (`/grupos` + `/oportunidades`), **clientes** e **tarefas**; demais páginas redirecionam (por exemplo para `/grupos`) e APIs fora do escopo respondem **403**. O código dos outros módulos pode permanecer no repositório (open core), mas **não fica utilizável** nessa edição sem recompilar com a variável adequada.

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

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` (ou `.env.local`) na raiz com as variáveis necessárias. **Não commite segredos.**

   Variáveis centrais:

   - `DATABASE_URL` — connection string PostgreSQL (pooler)
   - `DIRECT_URL` — connection string direta (recomendado para migrations com Prisma)
   - `NEXTAUTH_URL` e `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_CRM_EDITION` — use `oss` só para build da edição limitada; em produção completa, omita
   - Supabase (quando usar auth/storage): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`), e opcionalmente `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_AUTH_EMAIL_REDIRECT_URL`

   Lista mais completa para produção e deploy: veja [DEPLOY.md](./DEPLOY.md).

3. Ajuste o schema e gere o cliente Prisma (o `setup:dev` garante o datasource PostgreSQL):

   ```bash
   npm run setup:dev
   ```

4. Aplique migrations e (opcional) seed:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Na primeira vez, você pode usar `npm run dev:first`, que roda `setup:dev` antes do frontend.

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

Outros scripts utilitários (backup, exportação, etc.) estão em [package.json](./package.json).

## Estrutura e convenções

- Rotas e páginas em `app/`
- Features modulares em `components/features/<nome>/` (tipos, constantes, utils, hooks e componentes)
- Regras detalhadas para agentes e contribuição: [AGENTS.md](./AGENTS.md)

## Deploy

Instruções para Vercel, variáveis de ambiente, migrations e cron financeiro: [DEPLOY.md](./DEPLOY.md).

## Licença

Projeto privado (`private: true` no `package.json`). Ajuste esta seção se houver licença pública.
