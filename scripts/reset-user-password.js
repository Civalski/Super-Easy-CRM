
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

async function resetPassword(username, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    try {
        const user = await prisma.user.update({
            where: { username: username },
            data: { passwordHash: passwordHash }
        });
        console.log(`✅ Senha do usuário "${username}" alterada com sucesso para: ${newPassword}`);
    } catch (e) {
        console.error(`❌ Erro: Usuário "${username}" não encontrado.`);
    }
}

// Exemplo de uso: node scripts\reset-user-password.js usuario nova_senha
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Uso: node scripts\\reset-user-password.js <usuario> <nova_senha>');
} else {
    resetPassword(args[0], args[1])
        .finally(async () => await prisma.$disconnect());
}
