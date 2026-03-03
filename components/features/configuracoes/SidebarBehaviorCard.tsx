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
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <PanelLeft className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Menu lateral</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Abrir por botão (não ao passar o mouse)</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={openByButton}
          onChange={handleToggle}
          className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Abrir menu lateral por botão"
        />
      </div>
    </div>
  )
}
