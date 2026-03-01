/**
 * Preferencia de tema do CRM
 */
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  THEME_EVENT,
  getThemePreference,
  setThemePreference,
  type AppTheme,
} from '@/lib/ui/themePreference'

export function ThemePreferenceCard() {
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

  const isLightTheme = theme === 'light'

  const handleToggle = () => {
    const nextTheme: AppTheme = isLightTheme ? 'dark' : 'light'
    setThemePreference(nextTheme)
  }

  return (
    <div className="crm-card p-6">
      <div className="mb-4 flex items-center gap-3">
        {isLightTheme ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tema
        </h2>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Usar tema claro
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Alterna entre visual escuro e claro nas telas do CRM.
          </p>
        </div>

        <input
          type="checkbox"
          checked={isLightTheme}
          onChange={handleToggle}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar tema claro"
        />
      </label>
    </div>
  )
}
