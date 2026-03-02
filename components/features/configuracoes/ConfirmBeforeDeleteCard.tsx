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
    <div className="crm-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirmação ao excluir
        </h2>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Pedir confirmação antes de excluir
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Exibe um diálogo de confirmação ao excluir itens (clientes, tarefas, etc.).
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => setConfirmBeforeDeletePreference(!enabled)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar confirmação antes de excluir"
        />
      </label>
    </div>
  )
}
