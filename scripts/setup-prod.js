const fs = require('fs');
const path = require('path');

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
};

console.log(`${colors.bright}${colors.blue}🚀 Configurando ambiente de PRODUÇÃO...${colors.reset}\n`);

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Verificar se já está configurado para PostgreSQL
if (schema.includes('provider = "postgresql"') && !schema.includes('provider = "sqlite"')) {
    console.log(`${colors.green}✅ Schema já configurado para PostgreSQL${colors.reset}`);
    process.exit(0);
}

// Trocar SQLite por PostgreSQL
const original = schema;
schema = schema.replace(
    /provider\s*=\s*"sqlite"/g,
    'provider = "postgresql"'
);

// Remover todos os comentários antigos e adicionar o novo
schema = schema.replace(
    /datasource db \{\s*[\s\S]*?provider/m,
    `datasource db {\n  // ☁️ Modo PRODUÇÃO - PostgreSQL (Render)\n  provider`
);

if (schema !== original) {
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log(`${colors.green}✅ Schema configurado para PostgreSQL (produção)${colors.reset}`);
    console.log(`${colors.yellow}⚙️  Regenerando Prisma Client...${colors.reset}\n`);
} else {
    console.log(`${colors.yellow}⚠️  Nenhuma alteração necessária${colors.reset}`);
}

process.exit(0);
