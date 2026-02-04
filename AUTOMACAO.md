# Automacao de Banco de Dados - Arker CRM

## Como Funciona

Este projeto usa **somente PostgreSQL (Supabase)**. Os scripts nao alternam mais entre bancos.

- `npm run dev` garante que o `schema.prisma` esta em PostgreSQL e gera o Prisma Client.
- `npm run build` faz o mesmo para producao.

---

## Uso Simples

### Desenvolvimento

```bash
npm run dev
```

Se quiser subir o backend Python junto:

```bash
npm run dev:full
```

### Deploy / Build

```bash
npm run build
```

---

## Scripts Disponiveis

```bash
# Garante Postgres no schema (dev)
npm run setup:dev

# Garante Postgres no schema (prod)
npm run setup:prod

# Prisma
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npm run db:seed

# Backend opcional
npm run dev:backend
npm run dev:full
```

---

## Arquivos da Automacao

```
scripts/
├── setup-dev.js       # Enforce PostgreSQL no schema
├── setup-prod.js      # Enforce PostgreSQL no schema
├── kill-ports.ps1     # Mata processos nas portas
└── test-db.js         # Testa conexao com o banco

prisma/
└── schema.prisma      # Schema principal (PostgreSQL)
```

---

## Fluxo de Trabalho

### Desenvolvimento Diario

```bash
npm run dev
```

Se mudar o `schema.prisma`:

```bash
npm run db:migrate
```

### Producao

```bash
npx prisma migrate deploy
```

---

## Troubleshooting

### "Error: P1000: Authentication failed"
- Verifique `DATABASE_URL` e `DIRECT_URL`

### Mudancas no schema nao aplicadas
```bash
npm run db:migrate
```

---

## Mais Informacoes

- DATABASE.md
- DEPLOY.md
