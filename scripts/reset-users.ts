/**
 * Script para resetar usuarios locais com contas limpas.
 *
 * Uso: npx tsx scripts/reset-users.ts
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

const USERS = [
  {
    username: 'alisson355',
    password: 'Pilhadeira10@',
    name: 'Admin',
    role: 'admin' as const,
  },
  {
    username: 'igor',
    password: 'igor2026@',
    name: 'Igor',
    role: 'user' as const,
  },
]

async function main() {
  console.log('Resetando usuarios...')

  const deleted = await prisma.user.deleteMany({})
  console.log(`${deleted.count} usuario(s) excluido(s)`)

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12)
    await prisma.user.create({
      data: {
        username: user.username,
        passwordHash,
        name: user.name,
        email: `${user.username}@local.test`,
        role: user.role,
      },
    })

    console.log(`Usuario criado: ${user.username} / ${user.password} (conta limpa)`)
  }

  console.log('\nConcluido. Nenhum dado artificial de CRM foi criado.')
}

main()
  .catch((error) => {
    console.error('Erro:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
