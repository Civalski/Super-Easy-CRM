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

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const backupPath = schemaPath + '.backup';

console.log(`${colors.bright}${colors.blue}🚀 Iniciando Inicialização do Banco de Dados (Supabase/PostgreSQL)${colors.reset}\n`);

// 1. Verificar Variável de Ambiente
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error(`${colors.red}❌ Erro: A variável de ambiente DATABASE_URL não está definida ou não parece ser uma URL PostgreSQL.${colors.reset}`);
    console.log(`\n${colors.yellow}Como usar (PowerShell):${colors.reset}`);
    console.log(`$env:DATABASE_URL="sua_connection_string_do_supabase"; node scripts/init-supabase.js`);
    console.log(`\n${colors.yellow}Como usar (CMD):${colors.reset}`);
    console.log(`set DATABASE_URL=sua_connection_string_do_supabase && node scripts/init-supabase.js`);
    process.exit(1);
}

// 2. Backup do Schema Original
console.log(`${colors.cyan}📦 Criando backup temporário do schema.prisma...${colors.reset}`);
if (fs.existsSync(backupPath)) {
    // Se já existe backup (de uma falha anterior), restaura primeiro pra garantir
    fs.copyFileSync(backupPath, schemaPath);
} else {
    fs.copyFileSync(schemaPath, backupPath);
}

try {
    // 3. Modificar Schema para PostgreSQL
    console.log(`${colors.cyan}🔧 Adaptando schema.prisma para PostgreSQL...${colors.reset}`);

    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Troca provider
    schema = schema.replace(
        /provider\s*=\s*"sqlite"/g,
        'provider = "postgresql"'
    );

    // Garante que o bloco datasource está limpo para PostgreSQL
    // Substitui o bloco datasource inteiro para evitar conflitos de comentários
    const newDatasource = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

    schema = schema.replace(/datasource db \{[\s\S]*?\}/, newDatasource);

    fs.writeFileSync(schemaPath, schema);
    console.log(`${colors.green}✅ Schema configurado temporariamente para processar a migração.${colors.reset}`);

    // 4. Rodar Migration
    console.log(`\n${colors.blue}🔄 Conectando ao Supabase e criando tabelas (prisma migrate deploy)...${colors.reset}`);
    console.log(`${colors.yellow}Aguarde...${colors.reset}\n`);

    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

    console.log(`\n${colors.bright}${colors.green}✅ SUCESSO! As tabelas foram criadas no seu banco Supabase.${colors.reset}`);

} catch (error) {
    console.error(`\n${colors.bright}${colors.red}❌ ALERTA: Ocorreu um erro durante a migração.${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    console.log(`\nVerifique se a Connection String está correta e se a senha contém caracteres especiais que precisam ser codificados (URL encoded).`);
} finally {
    // 5. Restaurar Backup
    console.log(`\n${colors.cyan}🔙 Restaurando schema.prisma original (SQLite) para desenvolvimento...${colors.reset}`);
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, schemaPath);
        fs.unlinkSync(backupPath);
        console.log(`${colors.green}✅ Ambiente local restaurado com sucesso.${colors.reset}`);
    } else {
        console.error(`${colors.red}⚠️  Arquivo de backup não encontrado! Seu schema.prisma pode estar com as configurações de produção.${colors.reset}`);
    }
}
