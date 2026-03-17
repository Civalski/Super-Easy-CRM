import {
  readUiPrefsCookie,
  writeUiPrefsCookie,
  DEFAULT_THEME as COOKIE_DEFAULT,
} from '@/lib/cookies'

export const THEME_STORAGE_KEY = 'arker:ui:theme'
export const THEME_EVENT = 'arker:ui:theme-change'

/** Tema padrão quando o usuário ainda não escolheu preferência */
export const DEFAULT_THEME: AppTheme = COOKIE_DEFAULT as AppTheme

export type AppTheme = 'dark' | 'light'

function normalizeTheme(theme: string | null | undefined): AppTheme {
  return theme === 'dark' || theme === 'light' ? theme : DEFAULT_THEME
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

export function getThemePreference(): AppTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME

  const fromCookie = readUiPrefsCookie()?.theme
  if (fromCookie) return normalizeTheme(fromCookie)

  const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY)
  return normalizeTheme(fromStorage)
}

export function setThemePreference(theme: AppTheme): void {
  if (typeof window === 'undefined') return

  const normalizedTheme = normalizeTheme(theme)
  writeUiPrefsCookie({ theme: normalizedTheme })
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  applyThemeToDocument(normalizedTheme)
  window.dispatchEvent(new CustomEvent<AppTheme>(THEME_EVENT, { detail: normalizedTheme }))
}
