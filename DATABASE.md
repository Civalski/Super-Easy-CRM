# Guia de Banco de Dados - Arker CRM

## Configuracao Atual

Este projeto usa somente **PostgreSQL (Supabase)** para desenvolvimento e producao.

---

## Variaveis de Ambiente

Configure no `.env.local` (dev) e no ambiente de producao:

```env
# Conexao com pooler (runtime)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"

# Conexao direta (CLI / migrations)
DIRECT_URL="postgresql://user:password@host:5432/postgres"
```

---

## Desenvolvimento

```bash
# Gerar Prisma Client
npm run db:generate

# Criar/aplicar migrations (recomendado)
npm run db:migrate

# Sincronizar schema sem migration (somente prototipo local)
npm run db:push:dev

# Seed (opcional)
npm run db:seed

# Iniciar projeto
npm run dev
```

Observacao:
- `npm run dev` nao executa mais `db push` automaticamente.
- Isso evita resets acidentais quando houver mudancas destrutivas no schema.

---

## Producao (Supabase)

1. Configure `DATABASE_URL` e `DIRECT_URL` no host.
2. Aplique migrations:

```bash
npm run db:deploy
```

3. (Opcional recomendado) Verifique status antes do deploy:

```bash
npm run db:status
```

---

## Comandos Uteis do Prisma

```bash
npm run db:generate   # Gerar Prisma Client
npm run db:push       # Enviar schema direto (apenas prototipo)
npm run db:push:dev   # Push local + regenerate client
npm run db:migrate    # Criar/aplicar migration (dev)
npm run db:deploy     # Aplicar migrations em producao
npm run db:status     # Verificar estado das migrations
npm run db:studio     # Prisma Studio
npm run db:seed       # Seed inicial
```

---

## Troubleshooting

### Erro: "Can't reach database server"
- Verifique `DATABASE_URL`
- Confirme host, porta e credenciais

### Erro: "Migration failed"
```bash
npx prisma migrate deploy
```

---

## Recursos

- Prisma Docs
- Supabase Docs
