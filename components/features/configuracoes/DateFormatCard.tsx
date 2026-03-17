/**
 * Preferência de formato de data
 */
'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/lib/icons'
import {
  DATE_FORMAT_EVENT,
  getDateFormatPreference,
  setDateFormatPreference,
  type DateFormatLocale,
} from '@/lib/ui/dateFormatPreference'

const OPTIONS: { value: DateFormatLocale; label: string; shortLabel: string }[] = [
  { value: 'pt-BR', label: 'Brasileiro (dd/mm/aaaa)', shortLabel: 'dd/mm' },
  { value: 'en-US', label: 'Americano (mm/dd/aaaa)', shortLabel: 'mm/dd' },
]

export function DateFormatCard() {
  const [locale, setLocale] = useState<DateFormatLocale>('pt-BR')

  useEffect(() => {
    const sync = () => setLocale(getDateFormatPreference())
    const handleChange = (event: Event) => {
      const e = event as CustomEvent<DateFormatLocale>
      setLocale(e.detail)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(DATE_FORMAT_EVENT, handleChange as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(DATE_FORMAT_EVENT, handleChange as EventListener)
    }
  }, [])

  return (
    <div className="crm-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Formato de data</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">dd/mm/aaaa ou mm/dd/aaaa</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-slate-300/80 p-0.5 dark:border-slate-600/50">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateFormatPreference(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                locale === opt.value
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
              }`}
              aria-label={opt.label}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
