# Backup do Banco de Dados

Usa **Node.js + pg** — não precisa instalar PostgreSQL. Conecta direto no Supabase.

## Automático (pre-commit)

O backup roda **automaticamente** antes de cada `git commit`. São mantidos apenas os **últimos 2 backups** na pasta `./backups/`.

## Manual

```bash
npm run db:backup
```

O backup é salvo em `./backups/backup-YYYY-MM-DDTHH-mm-ss.json` (formato JSON).

## Formato

O arquivo JSON contém todas as tabelas do schema `public`, com os dados exportados. Estrutura:

```json
{
  "_meta": { "exportedAt": "...", "tables": 20 },
  "users": [...],
  "clientes": [...],
  ...
}
```
