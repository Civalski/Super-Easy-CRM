/**
 * Preferencia de tema do CRM
 */
'use client'

import { Moon, Sun } from '@/lib/icons'
import { useThemePreference } from '@/lib/hooks/useThemePreference'

export function ThemePreferenceCard() {
  const { isLightTheme, updateTheme } = useThemePreference()

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
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-300/80 p-0.5 dark:border-slate-600/50">
          <button
            type="button"
            onClick={() => updateTheme('light')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isLightTheme
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => updateTheme('dark')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !isLightTheme
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            Escuro
          </button>
        </div>
      </div>
    </div>
  )
}
