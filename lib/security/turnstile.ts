import 'server-only'

export type TurnstileVerificationResult = {
  errorCodes: string[]
  success: boolean
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

type VerifyTurnstileInput = {
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

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        success: false,
        errorCodes: [`turnstile-http-${response.status}`],
      }
    }

    const data = (await response.json()) as {
      success?: boolean
      'error-codes'?: string[]
    }

    return {
      success: Boolean(data.success),
      errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : [],
    }
  } catch (_error) {
    return {
      success: false,
      errorCodes: ['turnstile-request-failed'],
    }
  }
}
