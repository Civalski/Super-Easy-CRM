const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}Inicializacao do Banco de Dados (Supabase/PostgreSQL)${colors.reset}\n`);

// 1. Verificar variaveis de ambiente
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error(`${colors.red}Erro: DATABASE_URL nao definida ou nao parece ser PostgreSQL.${colors.reset}`);
    console.log(`\n${colors.yellow}Como usar (PowerShell):${colors.reset}`);
    console.log(`$env:DATABASE_URL="sua_connection_string"; $env:DIRECT_URL="sua_direct_url"; node scripts/init-supabase.js`);
    console.log(`\n${colors.yellow}Como usar (CMD):${colors.reset}`);
    console.log(`set DATABASE_URL=sua_connection_string && set DIRECT_URL=sua_direct_url && node scripts/init-supabase.js`);
    process.exit(1);
}

if (!process.env.DIRECT_URL) {
    console.log(`${colors.yellow}Aviso: DIRECT_URL nao definida. Para migracoes, use uma conexao direta.${colors.reset}`);
}

// 2. Verificar migrations
const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
const hasMigrations = fs.existsSync(migrationsDir) &&
    fs.readdirSync(migrationsDir)
        .filter((name) => name !== 'migration_lock.toml')
        .length > 0;

if (!hasMigrations) {
    console.error(`${colors.red}Nenhuma migration encontrada em prisma/migrations.${colors.reset}`);
    console.log(`${colors.yellow}Crie uma migration localmente com:${colors.reset}`);
    console.log(`npx prisma migrate dev --name init`);
    process.exit(1);
}

try {
    console.log(`${colors.cyan}Aplicando migrations no Supabase (prisma migrate deploy)...${colors.reset}`);
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(`\n${colors.bright}${colors.green}Sucesso! Migrations aplicadas.${colors.reset}`);
} catch (error) {
    console.error(`\n${colors.bright}${colors.red}Erro ao aplicar migrations.${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    console.log(`\nVerifique a connection string e se ha migrations compatíveis com PostgreSQL.`);
    process.exit(1);
}
