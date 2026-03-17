/**
 * Preferência para ocultar ícones e descrições nos cabeçalhos das páginas
 */
'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard } from '@/lib/icons'
import {
  PAGE_HEADER_EVENT,
  getHidePageHeaderDecorations,
  setHidePageHeaderDecorations,
} from '@/lib/ui/pageHeaderPreference'

export function PageHeaderPreferenceCard() {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    const sync = () => setHide(getHidePageHeaderDecorations())
    const handleChange = (event: Event) => {
      const e = event as CustomEvent<boolean>
      setHide(e.detail)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(PAGE_HEADER_EVENT, handleChange as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(PAGE_HEADER_EVENT, handleChange as EventListener)
    }
  }, [])

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Ocultar ícones e descrições nas páginas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Remove ícone, título e descrição do cabeçalho de cada página
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-300/80 p-0.5 dark:border-slate-600/50">
          <button
            type="button"
            onClick={() => setHidePageHeaderDecorations(false)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !hide
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
            aria-label="Mostrar ícones e descrições nas páginas"
          >
            Mostrar
          </button>
          <button
            type="button"
            onClick={() => setHidePageHeaderDecorations(true)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              hide
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
            aria-label="Ocultar ícones e descrições nas páginas"
          >
            Ocultar
          </button>
        </div>
      </div>
    </div>
  )
}
