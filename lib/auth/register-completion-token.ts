import { createHmac, timingSafeEqual } from 'crypto'
import { getNextAuthSecret } from '@/lib/nextauth-secret'

type RegisterCompletionTokenPayload = {
  userId: string
  exp: number
}

const TOKEN_TTL_SECONDS = 60 * 60 * 4

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

export function createRegisterCompletionToken(userId: string) {
  const secret = getNextAuthSecret()
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET nao configurado para gerar token de conclusao')
  }

  const payload: RegisterCompletionTokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyRegisterCompletionToken(token: string) {
  const secret = getNextAuthSecret()
  if (!secret) return null

  const [encodedPayload, providedSignature] = token.split('.')
  if (!encodedPayload || !providedSignature) return null

  const expectedSignature = signPayload(encodedPayload, secret)
  const providedBuffer = Buffer.from(providedSignature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload)
    ) as RegisterCompletionTokenPayload

    if (!payload.userId || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
