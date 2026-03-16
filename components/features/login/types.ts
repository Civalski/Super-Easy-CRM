import type { AppTheme } from '@/lib/ui/themePreference'

export type LoginThemeAppearance = {
  root: string
  rootGlow: string
  heroSection: string
  heroPrimaryGlow: string
  heroSecondaryGlow: string
  heroTitle: string
  heroDescription: string
  heroChip: string
  formSection: string
  formGlow: string
  formCard: string
  label: string
  input: string
  helperText: string
  link: string
  errorBox: string
  turnstileMessage: string
  fallback: string
}

export type LoginThemeMap = Record<AppTheme, LoginThemeAppearance>

declare global {
  interface Window {
    particlesJS?: (tagId: string, params: unknown) => void
  }
}

export {}
