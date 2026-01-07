import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Garantir que a DATABASE_URL está configurada corretamente para SQLite
let databaseUrl = process.env.DATABASE_URL

if (!databaseUrl || !databaseUrl.startsWith('file:')) {
  // Se não estiver configurado corretamente, usar o caminho padrão do SQLite
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  databaseUrl = `file:${dbPath.replace(/\\/g, '/')}`
  console.warn('DATABASE_URL não configurada corretamente, usando:', databaseUrl)

  // Definir a variável de ambiente para o Prisma
  process.env.DATABASE_URL = databaseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

