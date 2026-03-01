import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL nao definida para inicializar o Prisma Client')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função legada para compatibilidade, agora apenas um stub que resolve imediatamente
// O banco de dados é gerenciado via scripts npm (setup:dev, setup:prod)
export async function ensureDatabaseInitialized() {
  return Promise.resolve()
}

export async function withInitializedDb<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}

