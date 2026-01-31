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

console.log(`${colors.bright}${colors.blue}🔧 Configurando ambiente de DESENVOLVIMENTO...${colors.reset}\n`);

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Verificar se já está configurado para SQLite
if (schema.includes('provider = "sqlite"') && !schema.includes('provider = "postgresql"')) {
    console.log(`${colors.green}✅ Schema já configurado para SQLite${colors.reset}`);
    process.exit(0);
}

// Trocar PostgreSQL por SQLite
const original = schema;
schema = schema.replace(
    /provider\s*=\s*"postgresql"/g,
    'provider = "sqlite"'
);

// Remover todos os comentários antigos e adicionar o novo
schema = schema.replace(
    /datasource db \{\s*[\s\S]*?provider/m,
    `datasource db {\n  // 🏠 Modo DESENVOLVIMENTO - SQLite local\n  provider`
);

if (schema !== original) {
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log(`${colors.green}✅ Schema configurado para SQLite (desenvolvimento)${colors.reset}`);
    console.log(`${colors.yellow}⚙️  Regenerando Prisma Client...${colors.reset}\n`);
} else {
    console.log(`${colors.yellow}⚠️  Nenhuma alteração necessária${colors.reset}`);
}

process.exit(0);
