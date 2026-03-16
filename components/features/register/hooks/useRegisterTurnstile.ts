'use client'

import type { AppTheme } from '@/lib/ui/themePreference'
import { useTurnstileWidget } from '@/components/common/turnstile/useTurnstileWidget'
import { getTurnstileTheme } from '@/components/features/login/utils'

export function useRegisterTurnstile(
  onError: (message: string) => void,
  theme: AppTheme = 'dark'
) {
  return useTurnstileWidget({
    action: 'register',
    errorMessage: 'Confirme a verificacao anti-bot para continuar',
    onError,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '',
    size: 'flexible',
    theme: getTurnstileTheme(theme),
  })
}
