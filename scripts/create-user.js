
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL nao definida');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createUser(username, password, name = null, email = null) {
    const passwordHash = await bcrypt.hash(password, 12);

    try {
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                name: name ?? username,
                email: email ?? null,
                role: 'user',
            },
        });
        console.log(`✅ Usuário "${username}" criado com sucesso.`);
        return user;
    } catch (e) {
        if (e.code === 'P2002') {
            console.error(`❌ Erro: Já existe um usuário com username "${username}".`);
        } else {
            throw e;
        }
    }
}

// Uso: node scripts/create-user.js <usuario> <senha> [nome] [email]
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Uso: node scripts\\create-user.js <usuario> <senha> [nome] [email]');
} else {
    createUser(args[0], args[1], args[2] ?? null, args[3] ?? null)
        .finally(async () => await prisma.$disconnect());
}
