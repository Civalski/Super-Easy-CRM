/**
 * Preferência de densidade das listas e tabelas
 */
'use client'

import { useEffect, useState } from 'react'
import { LayoutList } from '@/lib/icons'
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
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutList className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Densidade das listas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Modo compacto: mais linhas por tela</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={density === 'compact'}
          onChange={() => setListDensityPreference(density === 'compact' ? 'comfortable' : 'compact')}
          className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-label="Ativar modo compacto"
        />
      </div>
    </div>
  )
}
