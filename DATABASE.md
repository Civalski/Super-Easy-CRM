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

# Criar migrations (recomendado)
npm run db:migrate

# Aplicar schema rapidamente (somente dev/prototipo)
npm run db:push

# Seed (opcional)
npm run db:seed

# Iniciar projeto
npm run dev
```

---

## Producao (Supabase)

1. Configure `DATABASE_URL` e `DIRECT_URL` no host.
2. Aplique migrations:

```bash
npx prisma migrate deploy
```

---

## Comandos Uteis do Prisma

```bash
npm run db:generate   # Gerar Prisma Client
npm run db:push       # Enviar schema direto (dev)
npm run db:migrate    # Criar migration (dev)
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
