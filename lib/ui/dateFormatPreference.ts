import { readUiPrefsCookie, writeUiPrefsCookie } from '@/lib/cookies'

export const DATE_FORMAT_STORAGE_KEY = 'arker:ui:date-format'
export const DATE_FORMAT_EVENT = 'arker:ui:date-format-change'

export type DateFormatLocale = 'pt-BR' | 'en-US'

function normalizeLocale(value: string | null | undefined): DateFormatLocale {
  return value === 'en-US' ? 'en-US' : 'pt-BR'
}

export function getDateFormatPreference(): DateFormatLocale {
  if (typeof window === 'undefined') return 'pt-BR'
  const fromCookie = readUiPrefsCookie()?.dateFormat
  if (fromCookie) return normalizeLocale(fromCookie)
  const stored = window.localStorage.getItem(DATE_FORMAT_STORAGE_KEY)
  return normalizeLocale(stored)
}

export function setDateFormatPreference(locale: DateFormatLocale): void {
  if (typeof window === 'undefined') return
  const normalized = normalizeLocale(locale)
  writeUiPrefsCookie({ dateFormat: normalized })
  window.localStorage.setItem(DATE_FORMAT_STORAGE_KEY, normalized)
  window.dispatchEvent(new CustomEvent<DateFormatLocale>(DATE_FORMAT_EVENT, { detail: normalized }))
}
