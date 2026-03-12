/**
 * Preferência de posição do menu: lateral (sidebar) ou topo (header)
 */
'use client'

import { useEffect, useState } from 'react'
import { LayoutList } from '@/lib/icons'
import {
  MENU_LAYOUT_EVENT,
  getMenuLayout,
  setMenuLayout,
  type MenuLayoutType,
} from '@/lib/ui/menuLayoutPreference'

export function MenuLayoutCard() {
  const [layout, setLayout] = useState<MenuLayoutType>('header')

  useEffect(() => {
    const sync = () => {
      setLayout(getMenuLayout())
    }

    const handleLayoutChange = (event: Event) => {
      const customEvent = event as CustomEvent<MenuLayoutType>
      setLayout(customEvent.detail)
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(MENU_LAYOUT_EVENT, handleLayoutChange as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(MENU_LAYOUT_EVENT, handleLayoutChange as EventListener)
    }
  }, [])

  const handleChange = (value: MenuLayoutType) => {
    setLayout(value)
    setMenuLayout(value)
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <LayoutList className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Posição do menu</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Menu lateral ou menu no topo/header
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-300/80 p-0.5 dark:border-slate-600/50">
          <button
            type="button"
            onClick={() => handleChange('sidebar')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              layout === 'sidebar'
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            Lateral
          </button>
          <button
            type="button"
            onClick={() => handleChange('header')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              layout === 'header'
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
            }`}
          >
            Topo
          </button>
        </div>
      </div>
    </div>
  )
}
