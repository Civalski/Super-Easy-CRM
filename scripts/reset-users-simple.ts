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

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variavel de ambiente ${name} nao definida. Defina no .env.`)
  return value
}

async function main() {
  const adminUsername = requiredEnv('RESET_ADMIN_USERNAME')
  const testUser1 = requiredEnv('RESET_TEST1_USERNAME')
  const testUser1Pass = requiredEnv('RESET_TEST1_PASSWORD')
  const testUser2 = requiredEnv('RESET_TEST2_USERNAME')
  const testUser2Pass = requiredEnv('RESET_TEST2_PASSWORD')

  console.log(`Excluindo usuários (exceto ${adminUsername})...`)

  const deleted = await prisma.user.deleteMany({
    where: { username: { not: adminUsername } },
  })
  console.log(`${deleted.count} usuário(s) excluído(s)`)

  const [hash1, hash2] = await Promise.all([
    bcrypt.hash(testUser1Pass, 12),
    bcrypt.hash(testUser2Pass, 12),
  ])

  await prisma.user.create({
    data: {
      username: testUser1,
      passwordHash: hash1,
      name: 'Teste 1',
      email: `${testUser1}@local.test`,
      role: 'user',
    },
  })
  console.log(`Usuário criado: ${testUser1}`)

  await prisma.user.create({
    data: {
      username: testUser2,
      passwordHash: hash2,
      name: 'Teste 2',
      email: `${testUser2}@local.test`,
      role: 'user',
    },
  })
  console.log(`Usuário criado: ${testUser2}`)

  console.log('\nConcluído.')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
