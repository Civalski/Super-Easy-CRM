import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrencyCompact } from '@/lib/format'
import type { TeamMemberPerformance, TeamMetrics, TeamPeriod, TeamPeriodRange } from './types'

export function getMemberLabel(member: Pick<TeamMemberPerformance, 'name' | 'username'>) {
  const trimmedName = member.name?.trim()
  if (trimmedName) return trimmedName
  return member.username
}

export function formatMetricValue(metric: keyof TeamMetrics, value: number) {
  return metric === 'faturamento' ? formatCurrencyCompact(value) : String(value)
}

export function formatPeriodRange(period: TeamPeriod, range: TeamPeriodRange) {
  const start = new Date(range.start)
  const end = new Date(range.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  if (period === 'day') {
    return format(start, "dd 'de' MMM", { locale: ptBR })
  }

  if (period === 'week') {
    return `${format(start, 'dd/MM', { locale: ptBR })} a ${format(end, 'dd/MM', { locale: ptBR })}`
  }

  return format(start, "MMMM 'de' yyyy", { locale: ptBR })
}

export function getActivityScore(metrics: TeamMetrics) {
  return (
    metrics.faturamento * 1000 +
    metrics.pedidos * 100 +
    metrics.orcamentos * 10 +
    metrics.tarefas * 3 +
    metrics.contatos
  )
}

export function sortMembersByPeriod(members: TeamMemberPerformance[], period: TeamPeriod) {
  return [...members].sort((left, right) => {
    const rightMetrics = right.metrics[period]
    const leftMetrics = left.metrics[period]
    return getActivityScore(rightMetrics) - getActivityScore(leftMetrics)
  })
}
