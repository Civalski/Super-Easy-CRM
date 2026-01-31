# 🤖 Automação de Banco de Dados - Arker CRM

## 📋 Como Funciona

Este projeto possui **automação inteligente** que detecta o ambiente e configura o banco de dados automaticamente:

- **🏠 Desenvolvimento Local** → SQLite (automático ao usar `npm run dev`)
- **☁️ Produção (Render)** → PostgreSQL (automático ao usar `npm run build`)

## ✨ Uso Simples

### Para Desenvolvimento Local

```bash
npm run dev
```

**O que acontece automaticamente:**
1. ✅ Detecta ambiente de desenvolvimento
2. ✅ Configura `schema.prisma` para SQLite
3. ✅ Regenera Prisma Client
4. ✅ Mata processos nas portas 3000 e 5000
5. ✅ Inicia frontend (Next.js) e backend (FastAPI)

### Para Deploy/Build

```bash
npm run build
```

**O que acontece automaticamente:**
1. ✅ Detecta ambiente de produção
2. ✅ Configura `schema.prisma` para PostgreSQL
3. ✅ Regenera Prisma Client
4. ✅ Faz build do Next.js

---

## 🔧 Scripts Disponíveis

### Automação

```bash
# Configurar para desenvolvimento (SQLite)
npm run setup:dev

# Configurar para produção (PostgreSQL)
npm run setup:prod
```

### Desenvolvimento

```bash
# Iniciar desenvolvimento (auto-configura SQLite)
npm run dev

# Apenas frontend
npm run dev:frontend

# Apenas backend
npm run dev:backend
```

### Banco de Dados

```bash
# Gerar Prisma Client
npm run db:generate

# Aplicar mudanças no schema (desenvolvimento)
npm run db:push

# Criar migration (produção)
npm run db:migrate

# Abrir Prisma Studio (visualizar dados)
npm run db:studio

# Seed (dados iniciais)
npm run db:seed
```

### Build e Deploy

```bash
# Build para produção (auto-configura PostgreSQL)
npm run build

# Iniciar produção (após build)
npm start

# Lint/verificação de código
npm run lint
```

---

## 📁 Arquivos da Automação

```
scripts/
├── setup-dev.js       # Configura SQLite para desenvolvimento
├── setup-prod.js      # Configura PostgreSQL para produção
├── kill-ports.ps1     # Mata processos nas portas
└── test-db.js         # Testa conexão com banco

prisma/
├── schema.prisma      # Schema principal (auto-configurado)
└── schema.sqlite.prisma  # Backup do schema SQLite
```

---

## 🎯 Fluxo de Trabalho

### 1️⃣ Desenvolvimento Diário

```bash
# 1. Iniciar projeto
npm run dev

# 2. Fazer mudanças no código...

# 3. Se mudar schema.prisma, aplicar mudanças:
npm run db:push
```

### 2️⃣ Deploy para Render

```bash
# 1. Commitar mudanças
git add .
git commit -m "feat: nova funcionalidade"

# 2. Push para repositório
git push origin main

# 3. Render faz automaticamente:
#    - npm run build (configura PostgreSQL)
#    - Gera Prisma Client
#    - Faz deploy
```

### 3️⃣ Mudanças no Schema

Quando você modificar o `schema.prisma`:

**Desenvolvimento:**
```bash
npm run db:push
# Aplica mudanças diretamente no SQLite
```

**Produção:**
```bash
npm run db:migrate
# Cria migration para PostgreSQL
# Commit a migration para o repositório
```

---

## 🔍 Como Saber Qual Banco Está Sendo Usado?

Olhe no `schema.prisma`:

**SQLite (Dev):**
```prisma
datasource db {
  // Auto-configurado para DESENVOLVIMENTO (SQLite)
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**PostgreSQL (Prod):**
```prisma
datasource db {
  // Auto-configurado para PRODUÇÃO (PostgreSQL)
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## ⚙️ Configuração Manual (Se Necessário)

Se precisar configurar manualmente:

**Para SQLite:**
```bash
node scripts/setup-dev.js
npm run db:generate
```

**Para PostgreSQL:**
```bash
node scripts/setup-prod.js
npm run db:generate
```

---

## 🚨 Troubleshooting

### "Error: P1000: Authentication failed"
- Verifique a `DATABASE_URL` no `.env.local` ou `.env`
- Para dev: deve ser `file:./dev.db`
- Para prod: deve ser a connection string do PostgreSQL

### "Schema já configurado para..."
- Normal! A automação detectou que não precisa trocar
- Tudo está funcionando corretamente

### Build falha no Render
1. Verifique se `DATABASE_URL` está configurada no Render
2. Certifique-se que o PostgreSQL está criado e conectado
3. Verifique os logs: `npm run build` deve configurar PostgreSQL

### Mudanças no schema não aplicadas
```bash
# Forçar regeneração
npm run setup:dev  # ou setup:prod
npm run db:push
```

---

## 📚 Mais Informações

- [DATABASE.md](./DATABASE.md) - Guia completo de banco de dados
- [DEPLOY.md](./DEPLOY.md) - Guia de deploy no Render
- [Prisma Docs](https://www.prisma.io/docs)

---

## 💡 Dicas

1. **Sempre use `npm run dev`** - Nunca execute `next dev` diretamente
2. **Antes de commitar** - Verifique se o schema está como PostgreSQL para produção
3. **Dados locais** - Seu SQLite fica em `prisma/dev.db` (não commitado)
4. **Migrations** - Só crie migrations quando for fazer deploy (produção)

---

✅ **Sistema 100% automatizado!** Você só precisa usar `npm run dev` e desenvolver normalmente.
