/**
 * Preferência de confirmação antes de excluir
 */
'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import {
  CONFIRM_BEFORE_DELETE_EVENT,
  getConfirmBeforeDeletePreference,
  setConfirmBeforeDeletePreference,
} from '@/lib/ui/confirmBeforeDeletePreference'

export function ConfirmBeforeDeleteCard() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const sync = () => setEnabled(getConfirmBeforeDeletePreference())
    const handleChange = (event: Event) => {
      const e = event as CustomEvent<boolean>
      setEnabled(e.detail)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(CONFIRM_BEFORE_DELETE_EVENT, handleChange as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CONFIRM_BEFORE_DELETE_EVENT, handleChange as EventListener)
    }
  }, [])

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Confirmação ao excluir</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Diálogo antes de excluir itens</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => setConfirmBeforeDeletePreference(!enabled)}
          className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar confirmação antes de excluir"
        />
      </div>
    </div>
  )
}
