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
    <div className="crm-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Formato de data</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">dd/mm/aaaa ou mm/dd/aaaa</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-4">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2"
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
              <span className="text-sm text-gray-900 dark:text-white">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
