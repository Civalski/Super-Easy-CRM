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
```

---

## Prisma (Migrations)

```bash
npx prisma migrate deploy
```

---

## Checklist

- [ ] Database criado e variaveis configuradas
- [ ] Migrations aplicadas
- [ ] Frontend deployado

