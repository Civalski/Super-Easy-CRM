/**
 * Preferência de formato de data
 */
'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import {
  DATE_FORMAT_EVENT,
  getDateFormatPreference,
  setDateFormatPreference,
  type DateFormatLocale,
} from '@/lib/ui/dateFormatPreference'

const OPTIONS: { value: DateFormatLocale; label: string; example: string }[] = [
  { value: 'pt-BR', label: 'Brasileiro (dd/mm/aaaa)', example: '31/12/2025' },
  { value: 'en-US', label: 'Americano (mm/dd/aaaa)', example: '12/31/2025' },
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
    <div className="crm-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <Calendar className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Formato de data
        </h2>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Define como as datas são exibidas em todo o sistema.
      </p>
      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-900/20"
          >
            <input
              type="radio"
              name="date-format"
              value={opt.value}
              checked={locale === opt.value}
              onChange={() => setDateFormatPreference(opt.value)}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={opt.label}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {opt.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({opt.example})
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
