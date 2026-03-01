import { NextResponse } from 'next/server'
import { consumeRateLimit, type RateLimitConfig } from '@/lib/security/rate-limit'

export function enforceApiRateLimit(input: {
  key: string
  config: RateLimitConfig
  error: string
}) {
  const result = consumeRateLimit(input.key, input.config)
  if (result.allowed) return null

  return NextResponse.json(
    {
      error: input.error,
      code: 'RATE_LIMITED',
      retryAfterSec: result.retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(input.config.maxAttempts),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    }
  )
}
