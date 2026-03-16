# Arker CRM - Deploy

## Visao Geral

- Frontend (Next.js) -> Vercel
- Database (PostgreSQL) -> Supabase ou Render

---

## Deploy do Frontend (Vercel)

### Configuracao

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### Variaveis de Ambiente

```env
DATABASE_URL=<sua_connection_string_postgres>
DIRECT_URL=<sua_connection_string_direta>

# Autenticacao (NextAuth)
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=<gerar_com_openssl_rand_base64_32>

# Turnstile (Cloudflare)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<chave_do_site_turnstile>
TURNSTILE_SECRET_KEY=<chave_secreta_turnstile>

# Rate limit de autenticacao e recuperacao
AUTH_FORGOT_PASSWORD_WINDOW_SECONDS=1800
AUTH_FORGOT_PASSWORD_MAX_ATTEMPTS=3
AUTH_FORGOT_PASSWORD_BLOCK_SECONDS=1800
AUTH_RESEND_CONFIRMATION_WINDOW_SECONDS=1800
AUTH_RESEND_CONFIRMATION_MAX_ATTEMPTS=3
AUTH_RESEND_CONFIRMATION_BLOCK_SECONDS=1800

# Scheduler de automacoes financeiras
FINANCE_SCHEDULER_SECRET=<segredo_forte_para_cron>
CRON_SECRET=<opcional_no_vercel_cron>
```

---

## Prisma (Migrations)

```bash
npx prisma migrate deploy
```

---

## Cron recomendado (financeiro)

Chame periodicamente a rota abaixo (ex.: a cada 10-30 minutos):

```bash
POST /api/financeiro/automacoes/processar
Header: x-scheduler-secret: <FINANCE_SCHEDULER_SECRET>
```

Obs.: se usar Vercel Cron com `CRON_SECRET`, a rota tambem aceita
`Authorization: Bearer <CRON_SECRET>`.

Query params opcionais:
- `monthsAhead` (1..24, padrao `6`)
- `limit` (1..500, padrao `200`)
- `userId` (processa somente um usuario)

---

## Checklist

- [ ] Database criado e variaveis configuradas
- [ ] Migrations aplicadas
- [ ] Frontend deployado

