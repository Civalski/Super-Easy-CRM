export const THEME_STORAGE_KEY = 'arker:ui:theme'
export const THEME_EVENT = 'arker:ui:theme-change'

export type AppTheme = 'dark' | 'light'

function normalizeTheme(theme: string | null | undefined): AppTheme {
  return theme === 'light' ? 'light' : 'dark'
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
}

export function getThemePreference(): AppTheme {
  if (typeof window === 'undefined') return 'dark'

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return normalizeTheme(storedTheme)
}

export function setThemePreference(theme: AppTheme): void {
  if (typeof window === 'undefined') return

  const normalizedTheme = normalizeTheme(theme)
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme)
  applyThemeToDocument(normalizedTheme)
  window.dispatchEvent(new CustomEvent<AppTheme>(THEME_EVENT, { detail: normalizedTheme }))
}
