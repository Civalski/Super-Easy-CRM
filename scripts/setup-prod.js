const fs = require('fs');
const path = require('path');

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.blue}Configurando ambiente de PRODUCAO (PostgreSQL)...${colors.reset}\n`);

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
const original = schema;

const datasourceRegex = /datasource db \{[\s\S]*?\}/;
const datasourceMatch = schema.match(datasourceRegex);

if (!datasourceMatch) {
    console.error(`${colors.red}Erro: bloco datasource db nao encontrado no schema.prisma.${colors.reset}`);
    process.exit(1);
}

let datasourceBlock = datasourceMatch[0];

// Garantir provider PostgreSQL no bloco datasource
const providerRegex = /provider\s*=\s*"[^"]+"/;
if (providerRegex.test(datasourceBlock)) {
    datasourceBlock = datasourceBlock.replace(providerRegex, 'provider = "postgresql"');
} else {
    datasourceBlock = datasourceBlock.replace('datasource db {', 'datasource db {\n  provider = "postgresql"');
}

// Prisma v7: URLs sairam do schema.prisma e foram para prisma.config.ts
datasourceBlock = datasourceBlock.replace(/\n\s*url\s*=\s*env\("DATABASE_URL"\)\s*/g, '\n');
datasourceBlock = datasourceBlock.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)\s*/g, '\n');

// Atualizar cabecalho do datasource
if (!datasourceBlock.includes('PostgreSQL - Supabase')) {
    datasourceBlock = datasourceBlock.replace('datasource db {', 'datasource db {\n  // PostgreSQL - Supabase');
}

schema = schema.replace(datasourceRegex, datasourceBlock);

if (schema !== original) {
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log(`${colors.green}OK: schema.prisma ajustado para PostgreSQL.${colors.reset}`);
} else {
    console.log(`${colors.yellow}Aviso: schema.prisma ja esta em PostgreSQL.${colors.reset}`);
}

process.exit(0);
