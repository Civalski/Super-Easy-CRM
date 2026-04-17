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

# Edicao do CRM (build-time). Omita na producao completa.
# Use "oss" apenas se quiser o build limitado (funil + clientes + tarefas).
# NEXT_PUBLIC_CRM_EDITION=oss

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

# Scheduler de automacoes financeiras e leads
FINANCE_SCHEDULER_SECRET=<segredo_forte_para_cron>
LEADS_SCHEDULER_SECRET=<segredo_para_post_prospectos_agendamentos_processar>
CRON_SECRET=<opcional_no_vercel_cron>

# E-mail (Resend) — confirmacao de conta, esqueci senha
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@seudominio.com

# Supabase (Auth / storage conforme uso)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (checkout e webhook)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=

# Rate limit distribuido (recomendado em Vercel / multi-instancia)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Observabilidade (opcional)
# NEXT_PUBLIC_SENTRY_DSN=
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

## Cron recomendado (leads agendados)

Chame periodicamente (ex.: diario ou conforme volume):

```bash
POST /api/prospectos/agendamentos/processar
Header: x-scheduler-secret: <LEADS_SCHEDULER_SECRET>
```

Ou `Authorization: Bearer <LEADS_SCHEDULER_SECRET>`.

---

## Checklist

- [ ] Database criado e variaveis configuradas
- [ ] Migrations aplicadas (`prisma migrate deploy`)
- [ ] `NEXTAUTH_SECRET` e `NEXTAUTH_URL` de producao definidos
- [ ] Stripe: chaves live, webhook apontando para `https://<dominio>/api/billing/stripe/webhook`
- [ ] Turnstile e Resend configurados se usar registro/login por e-mail
- [ ] `UPSTASH_*` definido para rate limit consistente em serverless
- [ ] `FINANCE_SCHEDULER_SECRET` e `LEADS_SCHEDULER_SECRET` fortes; cron configurado
- [ ] Frontend deployado

