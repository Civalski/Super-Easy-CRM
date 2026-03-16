const DEFAULT_APP_TIME_ZONE = 'America/Sao_Paulo'

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getDateFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone)
  if (cached) return cached

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  formatterCache.set(timeZone, formatter)
  return formatter
}

function getDatePart(parts: Intl.DateTimeFormatPart[], type: 'year' | 'month' | 'day') {
  return parts.find((part) => part.type === type)?.value ?? ''
}

export function formatDateToLocalISO(
  value: Date | string | null | undefined,
  timeZone = DEFAULT_APP_TIME_ZONE
) {
  if (!value) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    value = new Date(trimmed)
  }

  if (Number.isNaN(value.getTime())) return ''

  const parts = getDateFormatter(timeZone).formatToParts(value)
  const year = getDatePart(parts, 'year')
  const month = getDatePart(parts, 'month')
  const day = getDatePart(parts, 'day')

  return `${year}-${month}-${day}`
}

export function getTodayLocalISO(timeZone = DEFAULT_APP_TIME_ZONE) {
  return formatDateToLocalISO(new Date(), timeZone)
}
