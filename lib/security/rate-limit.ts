import { Redis } from '@upstash/redis'

type RateLimitRecord = {
  attempts: number
  blockedUntil: number
  windowStartedAt: number
}

export type RateLimitConfig = {
  blockDurationMs: number
  maxAttempts: number
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

/* ------------------------------------------------------------------ */
/*  Store abstraction: Redis (distributed) or in-memory (local dev)   */
/* ------------------------------------------------------------------ */

const STORE_ERROR = Symbol('STORE_ERROR')
type StoreGetResult = RateLimitRecord | null | typeof STORE_ERROR

interface RateLimitStore {
  get(key: string): Promise<StoreGetResult>
  set(key: string, record: RateLimitRecord, ttlMs: number): Promise<void>
  del(key: string): Promise<void>
}

// --- Redis store (production / Vercel) ---

function createRedisStore(): RateLimitStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const redis = new Redis({ url, token })
  const PREFIX = 'rl:'

  return {
    async get(key) {
      try {
        const data = await redis.get<RateLimitRecord>(`${PREFIX}${key}`)
        return data ?? null
      } catch {
        console.error('[rate-limit] Redis GET failed — failing closed')
        return STORE_ERROR
      }
    },
    async set(key, record, ttlMs) {
      try {
        await redis.set(`${PREFIX}${key}`, record, { px: ttlMs })
      } catch {
        console.error('[rate-limit] Redis SET failed — rate limit may not persist')
      }
    },
    async del(key) {
      try {
        await redis.del(`${PREFIX}${key}`)
      } catch {
        console.error('[rate-limit] Redis DEL failed')
      }
    },
  }
}

// --- In-memory store (development fallback) ---

const MAX_STORE_SIZE = 10_000

const globalForRateLimit = globalThis as typeof globalThis & {
  __arkerRateLimitStore?: Map<string, RateLimitRecord>
}

const memMap =
  globalForRateLimit.__arkerRateLimitStore ?? new Map<string, RateLimitRecord>()
if (!globalForRateLimit.__arkerRateLimitStore) {
  globalForRateLimit.__arkerRateLimitStore = memMap
}

function cleanupMemStore(now: number) {
  if (memMap.size < MAX_STORE_SIZE) return
  for (const [k, v] of Array.from(memMap.entries())) {
    if (now - v.windowStartedAt > 86_400_000 && v.blockedUntil <= now) {
      memMap.delete(k)
    }
  }
}

const memoryStore: RateLimitStore = {
  async get(key) {
    return memMap.get(key) ?? null
  },
  async set(key, record) {
    const now = Date.now()
    cleanupMemStore(now)
    memMap.set(key, record)
  },
  async del(key) {
    memMap.delete(key)
  },
}

// Resolve once at module load; falls back automatically.
const store: RateLimitStore = createRedisStore() ?? memoryStore

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function createFreshRecord(now: number): RateLimitRecord {
  return { attempts: 0, blockedUntil: 0, windowStartedAt: now }
}

function recordTtlMs(config: RateLimitConfig): number {
  return Math.max(config.windowMs, config.blockDurationMs) + 60_000
}

/* ------------------------------------------------------------------ */
/*  Preset configs                                                    */
/* ------------------------------------------------------------------ */

export const loginRateLimitConfig: RateLimitConfig = {
  windowMs: parsePositiveInt(process.env.AUTH_LOGIN_WINDOW_SECONDS, 10 * 60) * 1000,
  maxAttempts: parsePositiveInt(process.env.AUTH_LOGIN_MAX_ATTEMPTS, 5),
  blockDurationMs: parsePositiveInt(process.env.AUTH_LOGIN_BLOCK_SECONDS, 15 * 60) * 1000,
}

export const registerRateLimitConfig: RateLimitConfig = {
  windowMs: parsePositiveInt(process.env.AUTH_REGISTER_WINDOW_SECONDS, 30 * 60) * 1000,
  maxAttempts: parsePositiveInt(process.env.AUTH_REGISTER_MAX_ATTEMPTS, 5),
  blockDurationMs: parsePositiveInt(process.env.AUTH_REGISTER_BLOCK_SECONDS, 30 * 60) * 1000,
}

export const forgotPasswordRateLimitConfig: RateLimitConfig = {
  windowMs: parsePositiveInt(process.env.AUTH_FORGOT_PASSWORD_WINDOW_SECONDS, 30 * 60) * 1000,
  maxAttempts: parsePositiveInt(process.env.AUTH_FORGOT_PASSWORD_MAX_ATTEMPTS, 3),
  blockDurationMs:
    parsePositiveInt(process.env.AUTH_FORGOT_PASSWORD_BLOCK_SECONDS, 30 * 60) * 1000,
}

export const resendConfirmationRateLimitConfig: RateLimitConfig = {
  windowMs:
    parsePositiveInt(process.env.AUTH_RESEND_CONFIRMATION_WINDOW_SECONDS, 30 * 60) * 1000,
  maxAttempts: parsePositiveInt(process.env.AUTH_RESEND_CONFIRMATION_MAX_ATTEMPTS, 3),
  blockDurationMs:
    parsePositiveInt(process.env.AUTH_RESEND_CONFIRMATION_BLOCK_SECONDS, 30 * 60) * 1000,
}

/* ------------------------------------------------------------------ */
/*  Public API (async — same contract, now distributed-ready)         */
/* ------------------------------------------------------------------ */

export async function consumeRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const existing = await store.get(key)

  if (existing === STORE_ERROR) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: 30,
    }
  }

  if (existing && existing.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.blockedUntil - now) / 1000)),
    }
  }

  const record =
    existing && now - existing.windowStartedAt <= config.windowMs
      ? existing
      : createFreshRecord(now)

  record.attempts += 1

  if (record.attempts > config.maxAttempts) {
    record.blockedUntil = now + config.blockDurationMs
    await store.set(key, record, recordTtlMs(config))
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(config.blockDurationMs / 1000)),
    }
  }

  await store.set(key, record, recordTtlMs(config))
  return {
    allowed: true,
    remaining: Math.max(0, config.maxAttempts - record.attempts),
    retryAfterSec: 0,
  }
}

export async function resetRateLimit(key: string) {
  await store.del(key)
}
