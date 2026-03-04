import crypto from 'crypto'

const MERCADO_PAGO_API_BASE = 'https://api.mercadopago.com'
const DEFAULT_BACK_PATH = '/configuracoes'
const DEFAULT_SUBSCRIPTION_AMOUNT = 24.9
const DEFAULT_SUBSCRIPTION_REASON = 'Assinatura Arker Easy CRM'
const DEFAULT_SUBSCRIPTION_CURRENCY = 'BRL'
const DEFAULT_SUBSCRIPTION_FREQUENCY = 1
const DEFAULT_SUBSCRIPTION_FREQUENCY_TYPE = 'months'

export type MercadoPagoFrequencyType = 'days' | 'months'

export interface MercadoPagoSubscriptionSettings {
  amount: number
  reason: string
  currencyId: string
  frequency: number
  frequencyType: MercadoPagoFrequencyType
  backUrl?: string
  webhookUrl?: string
  webhookSecret?: string
}

interface MercadoPagoAutoRecurring {
  frequency?: number
  frequency_type?: string
  transaction_amount?: number
  currency_id?: string
}

export interface MercadoPagoPreApprovalResponse {
  id: string
  status?: string
  init_point?: string
  payer_email?: string
  external_reference?: string
  preapproval_plan_id?: string
  next_payment_date?: string
  auto_recurring?: MercadoPagoAutoRecurring
}

interface MercadoPagoRequestOptions {
  method: 'GET' | 'POST' | 'PUT'
  body?: unknown
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const normalized = Number(value.replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized <= 0) return fallback
  return normalized
}

function parseFrequencyType(value: string | undefined): MercadoPagoFrequencyType {
  if (value === 'days' || value === 'months') {
    return value
  }
  return DEFAULT_SUBSCRIPTION_FREQUENCY_TYPE
}

function getBaseAppUrl() {
  const fromEnv = process.env.NEXTAUTH_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:3000'
}

function normalizeUrlOrUndefined(value: string | undefined) {
  if (!value) return undefined

  const normalizedValue = value.trim()
  if (!normalizedValue) return undefined

  try {
    const url = new URL(normalizedValue)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined
    }

    const hostname = url.hostname.trim().toLowerCase()
    // Mercado Pago costuma rejeitar localhost/hosts locais em back_url.
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) {
      return undefined
    }

    return url.toString()
  } catch {
    return undefined
  }
}

function getMercadoPagoAccessTokenOrThrow() {
  const accessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ||
    process.env.ACCESS_TOKEN_MERCADOPAGO?.trim()
  if (!accessToken) {
    throw new Error(
      'Token do Mercado Pago nao configurado (MERCADOPAGO_ACCESS_TOKEN ou ACCESS_TOKEN_MERCADOPAGO)'
    )
  }
  return accessToken
}

export function getMercadoPagoSubscriptionSettings(): MercadoPagoSubscriptionSettings {
  const amount = parsePositiveNumber(
    process.env.MERCADOPAGO_SUBSCRIPTION_AMOUNT,
    DEFAULT_SUBSCRIPTION_AMOUNT
  )
  const frequency = Math.max(
    1,
    Math.round(
      parsePositiveNumber(
        process.env.MERCADOPAGO_SUBSCRIPTION_FREQUENCY,
        DEFAULT_SUBSCRIPTION_FREQUENCY
      )
    )
  )

  const backUrl = normalizeUrlOrUndefined(
    process.env.MERCADOPAGO_SUBSCRIPTION_BACK_URL?.trim() ||
      `${getBaseAppUrl()}${DEFAULT_BACK_PATH}`
  )

  const webhookUrl = normalizeUrlOrUndefined(
    process.env.MERCADOPAGO_WEBHOOK_URL?.trim() ||
      `${getBaseAppUrl()}/api/billing/mercado-pago/webhook`
  )

  return {
    amount,
    reason:
      process.env.MERCADOPAGO_SUBSCRIPTION_REASON?.trim() ||
      DEFAULT_SUBSCRIPTION_REASON,
    currencyId:
      process.env.MERCADOPAGO_SUBSCRIPTION_CURRENCY?.trim() ||
      DEFAULT_SUBSCRIPTION_CURRENCY,
    frequency,
    frequencyType: parseFrequencyType(
      process.env.MERCADOPAGO_SUBSCRIPTION_FREQUENCY_TYPE?.trim()
    ),
    backUrl,
    webhookUrl,
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || undefined,
  }
}

async function mercadoPagoRequest<T>(
  path: string,
  options: MercadoPagoRequestOptions
): Promise<T> {
  const accessToken = getMercadoPagoAccessTokenOrThrow()

  const response = await fetch(`${MERCADO_PAGO_API_BASE}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(
      `Mercado Pago API error ${response.status}: ${payload.slice(0, 500)}`
    )
  }

  return (await response.json()) as T
}

export async function createMercadoPagoSubscription(params: {
  payerEmail: string
  externalReference: string
}) {
  const settings = getMercadoPagoSubscriptionSettings()

  const body = {
    reason: settings.reason,
    payer_email: params.payerEmail,
    external_reference: params.externalReference,
    auto_recurring: {
      frequency: settings.frequency,
      frequency_type: settings.frequencyType,
      transaction_amount: settings.amount,
      currency_id: settings.currencyId,
      start_date: new Date().toISOString(),
    },
    ...(settings.backUrl ? { back_url: settings.backUrl } : {}),
    ...(settings.webhookUrl ? { notification_url: settings.webhookUrl } : {}),
    status: 'pending',
  }

  return mercadoPagoRequest<MercadoPagoPreApprovalResponse>('/preapproval', {
    method: 'POST',
    body,
  })
}

export async function getMercadoPagoSubscription(subscriptionId: string) {
  return mercadoPagoRequest<MercadoPagoPreApprovalResponse>(
    `/preapproval/${encodeURIComponent(subscriptionId)}`,
    {
      method: 'GET',
    }
  )
}

function parseSignatureHeader(value: string | null) {
  if (!value) return null

  let ts: string | undefined
  let v1: string | undefined

  const parts = value.split(',')
  for (const part of parts) {
    const [key, raw] = part.split('=', 2)
    if (!key || !raw) continue
    const normalizedKey = key.trim().toLowerCase()
    const normalizedValue = raw.trim()

    if (normalizedKey === 'ts') ts = normalizedValue
    if (normalizedKey === 'v1') v1 = normalizedValue
  }

  if (!ts || !v1) return null
  return { ts, v1 }
}

function safeHashCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

export function validateMercadoPagoWebhookSignature(params: {
  headers: Headers
  dataId: string
  webhookSecret?: string
}) {
  const secret = params.webhookSecret
  if (!secret) {
    return { valid: true, skipped: true }
  }

  const requestId = params.headers.get('x-request-id')
  const signatureHeader = params.headers.get('x-signature')
  const signature = parseSignatureHeader(signatureHeader)

  if (!signature) {
    return { valid: false, skipped: false }
  }

  const parts: string[] = []
  const normalizedDataId = params.dataId.trim().toLowerCase()
  if (normalizedDataId) parts.push(`id:${normalizedDataId};`)
  if (requestId) parts.push(`request-id:${requestId};`)
  if (signature.ts) parts.push(`ts:${signature.ts};`)

  const manifest = parts.join('')
  const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  return {
    valid: safeHashCompare(hash, signature.v1),
    skipped: false,
  }
}

export function normalizeMercadoPagoStatus(status: string | null | undefined) {
  if (!status) return 'inactive'
  return status.trim().toLowerCase()
}

export function isMercadoPagoStatusActive(status: string | null | undefined) {
  return normalizeMercadoPagoStatus(status) === 'authorized'
}
