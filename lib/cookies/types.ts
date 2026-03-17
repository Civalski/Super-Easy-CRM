/** Versão do schema de cookies para migração futura */
export const COOKIE_SCHEMA_VERSION = 1

export type UiTheme = 'dark' | 'light'
export type UiDensity = 'comfortable' | 'compact'
export type UiSidebar = 'auto' | 'button'
export type DateFormatLocale = 'pt-BR' | 'en-US'

export interface UiPrefsPayload {
  theme: UiTheme
  density: UiDensity
  sidebar: UiSidebar
  dateFormat: DateFormatLocale
}

export type AuthFlowSource = 'register' | 'oauth' | 'checkout'

export interface AuthFlowPayload {
  source: AuthFlowSource
  callbackUrl?: string
  nonce?: string
  status?: 'processing' | 'done'
  expiresAt: number
}

export interface UxFlagsPayload {
  guideSeen?: boolean
  onboardingDismissed?: boolean
  subscriptionPromptDismissed?: boolean
}
