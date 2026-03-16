'use client'

import { useEffect, useState } from 'react'
import {
  THEME_EVENT,
  getThemePreference,
  setThemePreference,
  type AppTheme,
} from '@/lib/ui/themePreference'

export function useThemePreference(initialTheme: AppTheme = 'dark') {
  const [theme, setTheme] = useState<AppTheme>(initialTheme)

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getThemePreference())
    }

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<AppTheme>
      setTheme(customEvent.detail)
    }

    syncTheme()
    window.addEventListener('storage', syncTheme)
    window.addEventListener(THEME_EVENT, handleThemeChange as EventListener)

    return () => {
      window.removeEventListener('storage', syncTheme)
      window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener)
    }
  }, [])

  return {
    theme,
    setTheme,
    updateTheme: setThemePreference,
    isLightTheme: theme === 'light',
  }
}
