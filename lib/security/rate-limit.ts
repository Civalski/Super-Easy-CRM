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

const MAX_STORE_SIZE = 10000

const globalForRateLimit = globalThis as typeof globalThis & {
  __arkerRateLimitStore?: Map<string, RateLimitRecord>
}

const store = globalForRateLimit.__arkerRateLimitStore ?? new Map<string, RateLimitRecord>()

if (!globalForRateLimit.__arkerRateLimitStore) {
  globalForRateLimit.__arkerRateLimitStore = store
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function cleanupStore(now: number) {
  if (store.size < MAX_STORE_SIZE) return

  for (const [key, value] of Array.from(store.entries())) {
    const windowExpired = now - value.windowStartedAt > 24 * 60 * 60 * 1000
    const blockExpired = value.blockedUntil <= now
    if (windowExpired && blockExpired) {
      store.delete(key)
    }
  }
}

function createFreshRecord(now: number): RateLimitRecord {
  return {
    attempts: 0,
    blockedUntil: 0,
    windowStartedAt: now,
  }
}

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

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  cleanupStore(now)

  const existing = store.get(key)

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
    store.set(key, record)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(config.blockDurationMs / 1000)),
    }
  }

  store.set(key, record)
  return {
    allowed: true,
    remaining: Math.max(0, config.maxAttempts - record.attempts),
    retryAfterSec: 0,
  }
}

export function resetRateLimit(key: string) {
  store.delete(key)
}
