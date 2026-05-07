# Arker Easy CRM

CRM operacional construído com Next.js (App Router), React, Prisma e PostgreSQL. Inclui fluxos de clientes, oportunidades, pedidos, financeiro, metas, prospecção e integrações (por exemplo Supabase, autenticação e pagamentos).

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão compatível com o projeto)
- PostgreSQL (em desenvolvimento costuma ser usado com [Supabase](https://supabase.com/))
- No Windows, o script de desenvolvimento usa PowerShell para liberar portas antes do servidor

## Configuração

1. Clone o repositório e instale dependências:

   ```bash
   npm install
   ```

2. Variáveis de ambiente: crie um arquivo `.env` na raiz (ou `.env.local`, conforme sua convenção) com pelo menos a URL do banco. O Prisma usa `DATABASE_URL` e, quando aplicável, `DIRECT_URL` (definidos em `prisma.config.ts`). **Não commite chaves de API, segredos ou URLs com credenciais.**

3. Gere o client do Prisma e aplique migrações:

   ```bash
   npm run db:generate
   npm run db:deploy
   ```

   Em desenvolvimento, você pode usar `npm run db:migrate` para criar migrações novas.

4. (Opcional) Popular dados iniciais:

   ```bash
   npm run db:seed
   ```

## Scripts úteis

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento Next.js (no Windows executa também o script de portas) |
| `npm run dev:first` | Setup de dev + servidor |
| `npm run build` | Build de produção (inclui setup de prod + `db:generate`) |
| `npm run start` | Inicia o app após build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript sem emitir arquivos |
| `npm run check` | Lint + type-check + teste de smoke da API |
| `npm run db:studio` | Prisma Studio |
| `npm run db:backup` | Backup do banco (veja `scripts/README-BACKUP.md` se existir) |

## Estrutura e convenções

- Rotas e páginas em `app/`
- Features modulares preferencialmente em `components/features/<nome-da-feature>/`
- Esquema e migrações em `prisma/`

Instruções adicionais para agentes e contribuidores (documentação da stack, segurança, limites de tamanho de arquivo e padrões de UX) estão em [`AGENTS.md`](./AGENTS.md).

## Licença

Projeto privado (`private: true` no `package.json`).
