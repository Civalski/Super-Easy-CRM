---
description: Como iniciar o servidor de desenvolvimento
---

# Iniciar o projeto

O CRM e 100% Next.js; nao existe backend Python separado.

## Primeira execucao (apos clone)

```powershell
npm install
npm run dev:first
```

`dev:first` executa `setup:dev` (copia envs + gera Prisma Client) e depois `next dev`.

## Execucao normal

```powershell
npm run dev
```

O script ja chama `scripts/kill-ports.ps1` para liberar a porta 3000 antes de subir o Next.

## URL

- Frontend + API: http://localhost:3000

## Banco de dados

- Dev e prod usam PostgreSQL (Supabase). Ver [DATABASE.md](../../DATABASE.md).
- Nao existe mais SQLite local.
- Se o schema mudou, ver [migrate-db.md](migrate-db.md).
