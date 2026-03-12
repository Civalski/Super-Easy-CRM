import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

type PrismaQueryContextStore = {
  requestId: string
  method: string
  route: string
  userId?: string
}

const prismaQueryContextStore = new AsyncLocalStorage<PrismaQueryContextStore>()

function normalizeMethod(method: string | undefined) {
  const trimmed = method?.trim()
  return trimmed && trimmed.length > 0 ? trimmed.toUpperCase() : 'UNKNOWN'
}

function normalizeRoute(route: string | undefined) {
  const trimmed = route?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : 'unknown'
}

export function runWithPrismaQueryContext<T>(
  input: {
    method?: string
    route?: string
    userId?: string
    requestId?: string
  },
  handler: () => Promise<T>
): Promise<T> {
  const context: PrismaQueryContextStore = {
    requestId: input.requestId ?? randomUUID(),
    method: normalizeMethod(input.method),
    route: normalizeRoute(input.route),
    userId: input.userId,
  }

  return prismaQueryContextStore.run(context, handler)
}

export function getPrismaQueryContext() {
  return prismaQueryContextStore.getStore()
}

export function setPrismaQueryContextUserId(userId: string) {
  const context = prismaQueryContextStore.getStore()
  if (!context) {
    return
  }

  context.userId = userId
}
