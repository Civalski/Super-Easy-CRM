import { getPostLoginPath } from '@/lib/crmEdition'
import type { AppTheme } from '@/lib/ui/themePreference'

export function resolveLoginCallbackUrl(callbackUrlFromQuery: string | null) {
  if (
    callbackUrlFromQuery &&
    callbackUrlFromQuery.startsWith('/') &&
    !callbackUrlFromQuery.startsWith('//') &&
    callbackUrlFromQuery !== '/login' &&
    callbackUrlFromQuery !== '/register'
  ) {
    return callbackUrlFromQuery
  }

  return getPostLoginPath()
}

export function getTurnstileTheme(theme: AppTheme): 'light' | 'dark' {
  return theme === 'light' ? 'light' : 'dark'
}
