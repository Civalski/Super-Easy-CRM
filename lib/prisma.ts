import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função legada para compatibilidade, agora apenas um stub que resolve imediatamente
// O banco de dados é gerenciado via scripts npm (setup:dev, setup:prod)
export async function ensureDatabaseInitialized() {
  return Promise.resolve()
}

export async function withInitializedDb<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}

