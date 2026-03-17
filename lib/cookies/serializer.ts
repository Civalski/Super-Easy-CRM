import type { UiPrefsPayload, AuthFlowPayload, UxFlagsPayload } from './types'
import { COOKIE_SCHEMA_VERSION } from './types'

function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function isValidTheme(v: unknown): v is 'dark' | 'light' {
  return v === 'dark' || v === 'light'
}

function isValidDensity(v: unknown): v is 'comfortable' | 'compact' {
  return v === 'comfortable' || v === 'compact'
}

function isValidSidebar(v: unknown): v is 'auto' | 'button' {
  return v === 'auto' || v === 'button'
}

function isValidDateFormat(v: unknown): v is 'pt-BR' | 'en-US' {
  return v === 'pt-BR' || v === 'en-US'
}

function isValidAuthFlowSource(v: unknown): v is 'register' | 'oauth' | 'checkout' {
  return v === 'register' || v === 'oauth' || v === 'checkout'
}

export function parseUiPrefsCookie(raw: string | undefined): UiPrefsPayload | null {
  const parsed = safeJsonParse<{ v?: number; ui?: Record<string, unknown> }>(raw, {})
  if (!parsed.ui || typeof parsed.ui !== 'object') return null
  if (parsed.v !== undefined && parsed.v !== COOKIE_SCHEMA_VERSION) return null

  const ui = parsed.ui
  const theme = isValidTheme(ui.theme) ? ui.theme : 'dark'
  const density = isValidDensity(ui.density) ? ui.density : 'comfortable'
  const sidebar = isValidSidebar(ui.sidebar) ? ui.sidebar : 'auto'
  const dateFormat = isValidDateFormat(ui.dateFormat) ? ui.dateFormat : 'pt-BR'

  return { theme, density, sidebar, dateFormat }
}

export function serializeUiPrefsCookie(payload: Partial<UiPrefsPayload>): string {
  const obj = {
    v: COOKIE_SCHEMA_VERSION,
    ui: {
      theme: payload.theme ?? 'dark',
      density: payload.density ?? 'comfortable',
      sidebar: payload.sidebar ?? 'auto',
      dateFormat: payload.dateFormat ?? 'pt-BR',
    },
  }
  return JSON.stringify(obj)
}

export function parseAuthFlowCookie(raw: string | undefined): AuthFlowPayload | null {
  const parsed = safeJsonParse<{
    v?: number
    flow?: Record<string, unknown>
  }>(raw, {})
  if (!parsed.flow || typeof parsed.flow !== 'object') return null
  if (parsed.v !== undefined && parsed.v !== COOKIE_SCHEMA_VERSION) return null

  const flow = parsed.flow
  const expiresAt = typeof flow.expiresAt === 'number' ? flow.expiresAt : 0
  if (Date.now() / 1000 > expiresAt) return null

  const source = isValidAuthFlowSource(flow.source) ? flow.source : 'oauth'
  const callbackUrl =
    typeof flow.callbackUrl === 'string' && flow.callbackUrl.startsWith('/')
      ? flow.callbackUrl
      : undefined
  const nonce = typeof flow.nonce === 'string' ? flow.nonce : undefined
  const status =
    flow.status === 'processing' || flow.status === 'done' ? flow.status : undefined

  return { source, callbackUrl, nonce, status, expiresAt }
}

export function serializeAuthFlowCookie(payload: AuthFlowPayload): string {
  const obj = {
    v: COOKIE_SCHEMA_VERSION,
    flow: {
      source: payload.source,
      callbackUrl: payload.callbackUrl ?? null,
      nonce: payload.nonce ?? null,
      status: payload.status ?? null,
      expiresAt: payload.expiresAt,
    },
  }
  return JSON.stringify(obj)
}

export function parseUxFlagsCookie(raw: string | undefined): UxFlagsPayload | null {
  const parsed = safeJsonParse<{ v?: number; ux?: Record<string, unknown> }>(raw, {})
  if (!parsed.ux || typeof parsed.ux !== 'object') return null
  if (parsed.v !== undefined && parsed.v !== COOKIE_SCHEMA_VERSION) return null

  const ux = parsed.ux
  return {
    guideSeen: ux.guideSeen === true,
    onboardingDismissed: ux.onboardingDismissed === true,
    subscriptionPromptDismissed: ux.subscriptionPromptDismissed === true,
  }
}

export function serializeUxFlagsCookie(payload: Partial<UxFlagsPayload>): string {
  const obj = {
    v: COOKIE_SCHEMA_VERSION,
    ux: {
      guideSeen: payload.guideSeen ?? false,
      onboardingDismissed: payload.onboardingDismissed ?? false,
      subscriptionPromptDismissed: payload.subscriptionPromptDismissed ?? false,
    },
  }
  return JSON.stringify(obj)
}
