/**
 * Preferencias de abertura do menu lateral
 */
'use client'

import { useEffect, useState } from 'react'
import { PanelLeft } from 'lucide-react'
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

  const handleToggle = () => {
    const nextOpenByButton = !openByButton
    setOpenByButton(nextOpenByButton)
    setSidebarOpenMode(nextOpenByButton ? 'button' : 'auto')
  }

  return (
    <div className="crm-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <PanelLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Menu lateral
        </h2>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Abrir por botao de toggle
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Quando ativo, o menu lateral nao abre automaticamente ao passar o mouse.
          </p>
        </div>

        <input
          type="checkbox"
          checked={openByButton}
          onChange={handleToggle}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar abertura do menu lateral por botao"
        />
      </label>
    </div>
  )
}
