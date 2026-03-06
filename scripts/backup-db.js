#!/usr/bin/env node
/**
 * Script de backup do banco PostgreSQL (Supabase).
 * Usa Node.js + pg - não precisa instalar PostgreSQL.
 * Salva dumps na pasta local ./backups/
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv/config');

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const KEEP_LAST = 2;
const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('Pasta backups/ criada.');
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.json')))
    .map((f) => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);
  const toRemove = files.slice(KEEP_LAST);
  toRemove.forEach(({ path: p }) => {
    fs.unlinkSync(p);
    console.log('Removido backup antigo:', path.basename(p));
  });
}

async function backupWithPg() {
  if (!DIRECT_URL) {
    console.error('Erro: DIRECT_URL ou DATABASE_URL não definida no .env');
    process.exit(1);
  }

  ensureBackupDir();
  const filename = `backup-${timestamp()}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  console.log('Conectando ao Supabase...');
  const client = new Client({ connectionString: DIRECT_URL });

  try {
    await client.connect();

    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const tables = tablesRes.rows.map((r) => r.tablename);

    const backup = { _meta: { exportedAt: new Date().toISOString(), tables: tables.length } };

    for (const table of tables) {
      const res = await client.query(`SELECT * FROM "${table}"`);
      backup[table] = res.rows;
      console.log(`  ${table}: ${res.rows.length} linhas`);
    }

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');
    console.log('Backup concluído:', filename);
    pruneOldBackups();
    return filepath;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await backupWithPg();
  } catch (err) {
    console.error('Falha no backup:', err.message);
    process.exit(1);
  }
}

main();
