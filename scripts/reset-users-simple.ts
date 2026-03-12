/**
 * Exclui todos os usuários exceto alisson355 e cria teste10 e teste20.
 * Uso: npx tsx scripts/reset-users-simple.ts
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL nao definida')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Excluindo usuários (exceto alisson355)...')

  const deleted = await prisma.user.deleteMany({
    where: { username: { not: 'alisson355' } },
  })
  console.log(`${deleted.count} usuário(s) excluído(s)`)

  const [teste10Hash, teste20Hash] = await Promise.all([
    bcrypt.hash('teste10', 12),
    bcrypt.hash('teste20', 12),
  ])

  await prisma.user.create({
    data: {
      username: 'teste10',
      passwordHash: teste10Hash,
      name: 'Teste 10',
      email: 'teste10@local.test',
      role: 'user',
    },
  })
  console.log('Usuário criado: teste10 / teste10')

  await prisma.user.create({
    data: {
      username: 'teste20',
      passwordHash: teste20Hash,
      name: 'Teste 20',
      email: 'teste20@local.test',
      role: 'user',
    },
  })
  console.log('Usuário criado: teste20 / teste20')

  console.log('\nConcluído. Usuários atuais: alisson355 (admin), teste10, teste20')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
