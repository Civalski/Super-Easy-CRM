/**
 * Preferencia de tema do CRM
 */
'use client'

import { Moon, Sun } from '@/lib/icons'
import { useThemePreference } from '@/lib/hooks/useThemePreference'

export function ThemePreferenceCard() {
  const { isLightTheme, updateTheme } = useThemePreference()

  const handleToggle = () => {
    updateTheme(isLightTheme ? 'dark' : 'light')
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {isLightTheme ? (
            <Sun className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Tema</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Tema claro ou escuro</p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Claro</span>
          <input
            type="checkbox"
            checked={isLightTheme}
            onChange={handleToggle}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="Ativar tema claro"
          />
        </label>
      </div>
    </div>
  )
}
