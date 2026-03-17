'use client'

import {
  UI_PREFS_COOKIE,
  AUTH_FLOW_COOKIE,
  UX_FLAGS_COOKIE,
  AUTH_FLOW_TTL_SECONDS,
  COOKIE_OPTIONS,
} from './constants'
import {
  parseUiPrefsCookie,
  serializeUiPrefsCookie,
  parseAuthFlowCookie,
  serializeAuthFlowCookie,
  parseUxFlagsCookie,
  serializeUxFlagsCookie,
} from './serializer'
import type { UiPrefsPayload, AuthFlowPayload, UxFlagsPayload } from './types'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string; sameSite?: 'lax'; secure?: boolean } = {}
) {
  if (typeof document === 'undefined') return

  const { maxAge, path = '/', sameSite = 'lax', secure = COOKIE_OPTIONS.secure } = options
  const parts = [`${name}=${encodeURIComponent(value)}`, `path=${path}`, `SameSite=${sameSite}`]
  if (secure) parts.push('Secure')
  if (maxAge !== undefined) parts.push(`max-age=${maxAge}`)

  document.cookie = parts.join('; ')
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=lax`
}

export function readUiPrefsCookie(): UiPrefsPayload | null {
  return parseUiPrefsCookie(getCookie(UI_PREFS_COOKIE))
}

export function writeUiPrefsCookie(payload: Partial<UiPrefsPayload>): void {
  const current = readUiPrefsCookie()
  const merged: UiPrefsPayload = {
    theme: payload.theme ?? current?.theme ?? 'dark',
    density: payload.density ?? current?.density ?? 'comfortable',
    sidebar: payload.sidebar ?? current?.sidebar ?? 'auto',
    dateFormat: payload.dateFormat ?? current?.dateFormat ?? 'pt-BR',
  }
  const serialized = serializeUiPrefsCookie(merged)
  setCookie(UI_PREFS_COOKIE, serialized, { maxAge: 365 * 24 * 60 * 60 })
}

export function readAuthFlowCookie(): AuthFlowPayload | null {
  return parseAuthFlowCookie(getCookie(AUTH_FLOW_COOKIE))
}

export function writeAuthFlowCookie(payload: Omit<AuthFlowPayload, 'expiresAt'>): void {
  const full: AuthFlowPayload = {
    ...payload,
    expiresAt: Math.floor(Date.now() / 1000) + AUTH_FLOW_TTL_SECONDS,
  }
  setCookie(AUTH_FLOW_COOKIE, serializeAuthFlowCookie(full), {
    maxAge: AUTH_FLOW_TTL_SECONDS,
  })
}

export function clearAuthFlowCookie(): void {
  deleteCookie(AUTH_FLOW_COOKIE)
}

export function readUxFlagsCookie(): UxFlagsPayload | null {
  return parseUxFlagsCookie(getCookie(UX_FLAGS_COOKIE))
}

export function writeUxFlagsCookie(payload: Partial<UxFlagsPayload>): void {
  const current = readUxFlagsCookie()
  const merged: UxFlagsPayload = {
    guideSeen: payload.guideSeen ?? current?.guideSeen ?? false,
    onboardingDismissed: payload.onboardingDismissed ?? current?.onboardingDismissed ?? false,
    subscriptionPromptDismissed:
      payload.subscriptionPromptDismissed ?? current?.subscriptionPromptDismissed ?? false,
  }
  setCookie(UX_FLAGS_COOKIE, serializeUxFlagsCookie(merged), {
    maxAge: 365 * 24 * 60 * 60,
  })
}

/** Gera um nonce curto para idempotência de fluxos */
export function createFlowNonce(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
