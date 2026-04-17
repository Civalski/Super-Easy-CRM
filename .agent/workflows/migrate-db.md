---
description: Fluxo de migrations Prisma (dev e prod)
---

# Atualizar banco (Prisma)

Referencia completa: [DATABASE.md](../../DATABASE.md). Este arquivo e um resumo operacional.

## Fluxo padrao

1. Editar [prisma/schema.prisma](../../prisma/schema.prisma).
2. Criar/aplicar migration em dev:

   ```powershell
   npm run db:migrate
   ```

   O Prisma CLI vai pedir um nome (use ingles curto descritivo: `add_pedidos_recorrencia`).
3. Regenerar o client:

   ```powershell
   npm run db:generate
   ```

4. Em producao:

   ```powershell
   npm run db:status    # ver pendencias
   npm run db:deploy    # aplicar migrations
   ```

## Conexoes

- `DATABASE_URL` (pooler) -> runtime.
- `DIRECT_URL` (conexao direta) -> CLI / migrations.

Ambas em `.env.local` (dev) e nas variaveis de ambiente do host (prod).

## NAO fazer

- Nao usar `prisma db push` para alterar producao ou substituir migrations.
- Nao editar arquivos ja presentes em `prisma/migrations/` (crie uma nova).
- Nao apagar migrations aplicadas em prod sem plano de rollback.

## Regra Cursor aplicavel

- `.cursor/rules/prisma-schema.mdc` (auto em `prisma/schema.prisma` e `prisma/migrations/**`).
