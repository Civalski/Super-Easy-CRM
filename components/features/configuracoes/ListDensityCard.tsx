/**
 * Preferência de densidade das listas e tabelas
 */
'use client'

import { useEffect, useState } from 'react'
import { LayoutList } from 'lucide-react'
import {
  LIST_DENSITY_EVENT,
  getListDensityPreference,
  setListDensityPreference,
  type ListDensity,
} from '@/lib/ui/listDensityPreference'

export function ListDensityCard() {
  const [density, setDensity] = useState<ListDensity>('comfortable')

  useEffect(() => {
    const sync = () => setDensity(getListDensityPreference())
    const handleChange = (event: Event) => {
      const e = event as CustomEvent<ListDensity>
      setDensity(e.detail)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(LIST_DENSITY_EVENT, handleChange as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(LIST_DENSITY_EVENT, handleChange as EventListener)
    }
  }, [])

  return (
    <div className="crm-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <LayoutList className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Densidade das listas
        </h2>
      </div>

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Modo compacto
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Exibe mais linhas por tela em tabelas e listas; menos espaçamento entre itens.
          </p>
        </div>
        <input
          type="checkbox"
          checked={density === 'compact'}
          onChange={() => setListDensityPreference(density === 'compact' ? 'comfortable' : 'compact')}
          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar modo compacto"
        />
      </label>
    </div>
  )
}
