'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import {
  THEME_EVENT,
  getThemePreference,
  type AppTheme,
} from '@/lib/ui/themePreference'

export function AppToaster() {
  const [theme, setTheme] = useState<AppTheme>('dark')

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

  return <Toaster position="top-right" richColors closeButton theme={theme} />
}
