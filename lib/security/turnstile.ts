import 'server-only'
import { randomUUID } from 'crypto'

export type TurnstileVerificationResult = {
  action?: string
  errorCodes: string[]
  hostname?: string
  success: boolean
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type VerifyTurnstileInput = {
  expectedAction?: string
  remoteIp?: string
  token: string
}

export async function verifyTurnstileToken(
  input: VerifyTurnstileInput
): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, errorCodes: ['turnstile-secret-missing-dev-bypass'] }
    }
    return { success: false, errorCodes: ['turnstile-secret-missing'] }
  }

  const token = input.token.trim()
  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] }
  }

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)

  if (input.remoteIp && input.remoteIp !== 'unknown') {
    body.set('remoteip', input.remoteIp)
  }
  body.set('idempotency_key', randomUUID())

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!response.ok) {
      return {
        success: false,
        errorCodes: [`turnstile-http-${response.status}`],
      }
    }

    const data = (await response.json()) as {
      action?: string
      success?: boolean
      'error-codes'?: string[]
      hostname?: string
    }
    const action = typeof data.action === 'string' ? data.action : undefined
    const hostname = typeof data.hostname === 'string' ? data.hostname : undefined
    const errorCodes = Array.isArray(data['error-codes']) ? data['error-codes'] : []

    if (data.success && input.expectedAction && action !== input.expectedAction) {
      return {
        success: false,
        action,
        errorCodes: ['turnstile-action-mismatch'],
        hostname,
      }
    }

    return {
      success: Boolean(data.success),
      action,
      errorCodes,
      hostname,
    }
  } catch (_error) {
    return {
      success: false,
      errorCodes: ['turnstile-request-failed'],
    }
  }
}
