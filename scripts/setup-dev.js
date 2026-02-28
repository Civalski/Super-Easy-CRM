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

console.log(`${colors.bright}${colors.blue}Configurando ambiente de DESENVOLVIMENTO (PostgreSQL)...${colors.reset}\n`);

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

// Garantir url e directUrl
if (!datasourceBlock.includes('url')) {
    datasourceBlock = datasourceBlock.replace('datasource db {', 'datasource db {\n  url = env("DATABASE_URL")');
}

if (!datasourceBlock.includes('directUrl')) {
    datasourceBlock = datasourceBlock.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');
}

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
