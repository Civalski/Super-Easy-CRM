# 🗄️ Guia de Banco de Dados - Arker CRM

## 📋 Configuração Atual

Este projeto está configurado para usar:
- **Desenvolvimento Local**: SQLite (arquivo `dev.db`)
- **Produção (Render)**: PostgreSQL

---

## 🏠 Desenvolvimento Local (SQLite)

### 1️⃣ Usar SQLite Localmente

O projeto já está configurado para SQLite. Para iniciar:

```bash
# 1. Gera o Prisma Client
npm run db:generate

# 2. Cria o banco SQLite e executa migrations
npm run db:push

# 3. (Opcional) Seed inicial
npm run db:seed

# 4. Iniciar o projeto
npm run dev
```

### 📍 Localização do Banco
O arquivo SQLite será criado em: `prisma/dev.db`

### 🔄 Mudanças no Schema

Quando você modificar o `schema.prisma`:

```bash
# Opção 1: Push direto (desenvolvimento rápido)
npm run db:push

# Opção 2: Criar migration (recomendado)
npm run db:migrate
```

---

## ☁️ Produção no Render (PostgreSQL)

### 1️⃣ Criar Database no Render

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `arker-crm-db`
   - **Database**: `arker_crm`
   - **User**: (gerado automaticamente)
   - **Region**: `Ohio` (ou mais próximo)
   - **Plan**: Free

4. Copie a **Internal Database URL**:
   ```
   postgresql://user:password@dpg-xxxxx/arker_crm
   ```

### 2️⃣ Configurar Web Service

No seu **Web Service do Render**, adicione a variável de ambiente:

```env
DATABASE_URL=postgresql://user:password@dpg-xxxxx/arker_crm
```

### 3️⃣ Executar Migrations

Após o deploy, execute no **Shell do Render**:

```bash
npx prisma migrate deploy
```

Ou adicione ao **Build Command**:
```bash
pip install -r backend/requirements.txt && npx prisma migrate deploy
```

---

## 🔀 Trocar Entre SQLite e PostgreSQL

### Para usar SQLite localmente:

1. Edite o arquivo `.env.local` ou `.env.development`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. No `schema.prisma`, use:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Execute:
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Para usar PostgreSQL localmente (testar produção):

1. Instale PostgreSQL localmente ou use Docker:
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=senha -p 5432:5432 -d postgres
   ```

2. Edite `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:senha@localhost:5432/arker_crm_dev"
   ```

3. No `schema.prisma`, use:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. Execute:
   ```bash
   npm run db:generate
   npm run db:push
   ```

---

## 🛠️ Comandos Úteis do Prisma

```bash
# Gerar Prisma Client (após mudanças no schema)
npm run db:generate

# Push schema para o banco (desenvolvimento)
npm run db:push

# Criar migration (produção)
npm run db:migrate

# Ver o banco de dados no navegador
npm run db:studio

# Seed (popular dados iniciais)
npm run db:seed
```

---

## 📊 Prisma Studio

Para visualizar e editar dados graficamente:

```bash
npm run db:studio
```

Abre em: `http://localhost:5555`

---

## ⚠️ Troubleshooting

### Erro: "Can't reach database server"

**SQLite:**
- Verifique se o caminho em `DATABASE_URL` está correto
- Certifique-se que a pasta `prisma/` existe

**PostgreSQL:**
- Verifique se a connection string está correta
- Teste a conexão: `psql <DATABASE_URL>`
- Verifique se o IP está liberado no Render

### Erro: "Migration failed"

```bash
# Resetar o banco (CUIDADO: Perde todos os dados!)
npx prisma migrate reset

# Ou aplicar migrations manualmente
npx prisma migrate deploy
```

### Schema desatualizado

```bash
# Sempre que mudar o schema.prisma:
npm run db:generate
npm run db:push  # ou db:migrate
```

---

## 📦 Backup e Restore

### SQLite (Local)

**Backup:**
```bash
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db
```

**Restore:**
```bash
cp prisma/backup-XXXXXXXX.db prisma/dev.db
```

### PostgreSQL (Render)

**Backup:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup.sql
```

---

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [PostgreSQL vs SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
