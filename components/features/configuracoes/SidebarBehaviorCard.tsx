/**
 * Preferencias de abertura do menu lateral
 */
'use client'

import { useEffect, useState } from 'react'
import { PanelLeft } from '@/lib/icons'
import {
  SIDEBAR_OPEN_MODE_EVENT,
  getSidebarOpenMode,
  setSidebarOpenMode,
} from '@/lib/ui/sidebarPreference'

export function SidebarBehaviorCard() {
  const [openByButton, setOpenByButton] = useState(false)

  useEffect(() => {
    const sync = () => {
      setOpenByButton(getSidebarOpenMode() === 'button')
    }

    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<'auto' | 'button'>
      setOpenByButton(customEvent.detail === 'button')
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(SIDEBAR_OPEN_MODE_EVENT, handleModeChange as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(SIDEBAR_OPEN_MODE_EVENT, handleModeChange as EventListener)
    }
  }, [])

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <PanelLeft className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Menu lateral</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Abrir por botão (não ao passar o mouse)</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-300/80 p-0.5 dark:border-slate-600/50">
          <button
            type="button"
            onClick={() => setSidebarOpenMode('auto')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !openByButton
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
            aria-label="Abrir menu ao passar o mouse"
          >
            Automático
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpenMode('button')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              openByButton
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
            aria-label="Abrir menu por botão"
          >
            Botão
          </button>
        </div>
      </div>
    </div>
  )
}
