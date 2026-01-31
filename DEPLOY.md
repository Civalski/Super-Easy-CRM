# Arker CRM - Deploy no Render

## 🚀 Guia de Deploy

Este projeto está configurado para deploy no Render como web app.

### 📋 Pré-requisitos

- Conta no [Render](https://render.com)
- Conta no [Vercel](https://vercel.com) (para o frontend Next.js)
- PostgreSQL database (Render fornece gratuitamente)

### 🎯 Estrutura de Deploy

- **Frontend (Next.js)** → Vercel
- **Backend (FastAPI)** → Render Web Service
- **Database (PostgreSQL)** → Render PostgreSQL

---

## 🔧 Deploy do Backend (Render)

### 1. Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:

```
Name: arker-crm-backend
Environment: Python
Region: Ohio (ou mais próximo)
Branch: main
Root Directory: (deixe vazio)
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2. Variáveis de Ambiente

Adicione em **Environment Variables**:

```env
PYTHON_VERSION=3.11.0
DATABASE_URL=<sua_connection_string_postgres>
PORT=10000
```

### 3. Criar PostgreSQL Database

1. No Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Copie a **Internal Database URL**
3. Cole em `DATABASE_URL` no Web Service

---

## 🌐 Deploy do Frontend (Vercel)

### 1. Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Importe o repositório

### 2. Configurações

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3. Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=https://arker-crm-backend.onrender.com
DATABASE_URL=<sua_connection_string_postgres>

# Autenticação (NextAuth.js)
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=<gerar_com_openssl_rand_base64_32>
```

---

## 🗄️ Configuração do Prisma

Após criar o database no Render:

```bash
# Executar migrations (no terminal do Render Shell)
npx prisma migrate deploy

# Ou via script do Render (Build Command):
pip install -r backend/requirements.txt && npx prisma migrate deploy
```

---

## 📦 Estrutura de Arquivos para Deploy

```
arker-crm/
├── backend/               # FastAPI backend
│   ├── app/              # Código da aplicação
│   ├── main.py           # Entry point
│   └── requirements.txt  # Dependências Python
├── app/                  # Next.js pages
├── components/           # Componentes React
├── prisma/              # Schema e migrations
├── Procfile             # Comando de start (Render)
├── runtime.txt          # Versão Python (Render)
└── package.json         # Dependências Node
```

---

## ✅ Checklist de Deploy

- [ ] PostgreSQL database criado no Render
- [ ] Backend deployed no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations do Prisma executadas
- [ ] Frontend deployed no Vercel
- [ ] CORS configurado no backend
- [ ] URLs atualizadas no frontend

---

## 🔍 Troubleshooting

### Backend não inicia
- Verifique os logs no Render Dashboard
- Confirme que `requirements.txt` está correto
- Verifique a `DATABASE_URL`

### Erro de CORS
- Adicione a URL do Vercel em `backend/app/core/config.py` → `CORS_ORIGINS`

### Database não conecta
- Use a **Internal Database URL** do Render
- Execute as migrations: `npx prisma migrate deploy`

---

## 📞 Suporte

Para problemas de deploy, consulte:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
