# Arker CRM - Deploy

## Visao Geral

- Frontend (Next.js) -> Vercel
- Database (PostgreSQL) -> Supabase ou Render
- Backend (FastAPI) -> Opcional (legado / uso futuro)

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

# Opcional: se usar backend FastAPI
# NEXT_PUBLIC_API_URL=https://arker-crm-backend.onrender.com
```

---

## Prisma (Migrations)

```bash
npx prisma migrate deploy
```

---

## Backend FastAPI (Opcional)

Se quiser manter o backend separado (legado), voce pode fazer deploy em um Web Service no Render:

```
Name: arker-crm-backend
Environment: Python
Root Directory: ./
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variaveis de ambiente (exemplo):

```env
PYTHON_VERSION=3.11.0
PORT=10000
PARQUET_DATA_PATH=../data/parquet
CORS_ORIGINS=["https://seu-app.vercel.app"]
```

---

## Checklist

- [ ] Database criado e variaveis configuradas
- [ ] Migrations aplicadas
- [ ] Frontend deployado
- [ ] Backend deployado (opcional)
