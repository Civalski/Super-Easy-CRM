import { createHash } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { getPrismaQueryContext } from '@/lib/observability/prisma-query-context'

const DEFAULT_SLOW_QUERY_THRESHOLD_MS = 300
const SLOW_QUERY_PREVIEW_LIMIT = 700
const SLOW_QUERY_FINGERPRINT_SIZE = 16
const PRISMA_SLOW_QUERY_LISTENER_SYMBOL = Symbol.for(
  'arker.prisma.slowQueryListenerInstalled'
)

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL nao definida para inicializar o Prisma Client')
}

function parseEnabledFlag(raw: string | undefined) {
  const value = raw?.trim().toLowerCase()
  if (!value) return false
  return ['1', 'true', 'on', 'yes'].includes(value)
}

function parseSlowQueryThresholdMs(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SLOW_QUERY_THRESHOLD_MS
  }
  return parsed
}

const slowQueryLogEnabled = parseEnabledFlag(
  process.env.PRISMA_SLOW_QUERY_LOG_ENABLED
)
const slowQueryThresholdMs = parseSlowQueryThresholdMs(
  process.env.PRISMA_SLOW_QUERY_THRESHOLD_MS
)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function compactSql(query: string) {
  return query.replace(/\s+/g, ' ').trim()
}

function getQueryType(query: string) {
  const compactQuery = compactSql(query)
  if (!compactQuery) {
    return 'UNKNOWN'
  }
  const [type] = compactQuery.split(' ', 1)
  return type?.toUpperCase() ?? 'UNKNOWN'
}

function getQueryFingerprint(query: string) {
  return createHash('sha1')
    .update(compactSql(query))
    .digest('hex')
    .slice(0, SLOW_QUERY_FINGERPRINT_SIZE)
}

function getParamsCount(params: string) {
  try {
    const parsed = JSON.parse(params) as unknown
    if (Array.isArray(parsed)) {
      return parsed.length
    }
    if (parsed && typeof parsed === 'object') {
      return Object.keys(parsed).length
    }
    return null
  } catch {
    return null
  }
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString })
  const log: Prisma.LogDefinition[] = slowQueryLogEnabled
    ? [{ emit: 'event', level: 'query' }]
    : []

  return new PrismaClient({
    adapter,
    log: log.length > 0 ? log : undefined,
  })
}

function ensureSlowQueryListener(client: PrismaClient) {
  if (!slowQueryLogEnabled) {
    return
  }

  const clientWithMarker = client as PrismaClient & {
    [PRISMA_SLOW_QUERY_LISTENER_SYMBOL]?: boolean
  }

  if (clientWithMarker[PRISMA_SLOW_QUERY_LISTENER_SYMBOL]) {
    return
  }

  clientWithMarker[PRISMA_SLOW_QUERY_LISTENER_SYMBOL] = true

  const queryEventClient = client as unknown as {
    $on: (eventType: 'query', callback: (event: Prisma.QueryEvent) => void) => void
  }

  queryEventClient.$on('query', (event: Prisma.QueryEvent) => {
    if (event.duration < slowQueryThresholdMs) {
      return
    }

    const context = getPrismaQueryContext()
    const compactQuery = compactSql(event.query)
    const payload = {
      ts: new Date().toISOString(),
      durationMs: event.duration,
      thresholdMs: slowQueryThresholdMs,
      method: context?.method ?? 'UNKNOWN',
      route: context?.route ?? 'unknown',
      requestId: context?.requestId ?? null,
      userId: context?.userId ?? null,
      queryType: getQueryType(event.query),
      queryFingerprint: getQueryFingerprint(event.query),
      queryPreview: compactQuery.slice(0, SLOW_QUERY_PREVIEW_LIMIT),
      paramsCount: getParamsCount(event.params),
      target: event.target ?? null,
    }

    console.warn('[slow-query]', JSON.stringify(payload))
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

ensureSlowQueryListener(prisma)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Funcao legada para compatibilidade.
export async function ensureDatabaseInitialized() {
  return Promise.resolve()
}

export async function withInitializedDb<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}
