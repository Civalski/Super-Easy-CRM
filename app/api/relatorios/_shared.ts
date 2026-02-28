import { NextRequest } from 'next/server'

export function getDateRangeFromQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const startDate = start ? new Date(start) : defaultStart
  const endDate = end ? new Date(end) : defaultEnd

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: 'Periodo invalido', startDate: defaultStart, endDate: defaultEnd }
  }

  if (startDate > endDate) {
    return {
      error: 'Data inicial deve ser menor ou igual a final',
      startDate: defaultStart,
      endDate: defaultEnd,
    }
  }

  return { startDate, endDate }
}

export function getDaysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  return ms <= 0 ? 0 : Math.ceil(ms / (1000 * 60 * 60 * 24))
}
