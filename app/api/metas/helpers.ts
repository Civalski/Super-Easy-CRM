import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getNextAuthSecret } from '@/lib/nextauth-secret'
import { GoalMetricType, GoalPeriodType } from '@prisma/client'
import {
  expandOpportunityStatuses,
  OpportunityStatus,
} from '@/lib/domain/status'

const metricStatusMap: Partial<Record<GoalMetricType, OpportunityStatus[]>> = {
  PROPOSTAS: ['orcamento'],
  VENDAS: ['fechada'],
  QUALIFICACAO: ['em_potencial'],
  PROSPECCAO: ['sem_contato'],
}

const metricsRequiringStatus = new Set<GoalMetricType>([
  GoalMetricType.PROPOSTAS,
  GoalMetricType.VENDAS,
  GoalMetricType.QUALIFICACAO,
  GoalMetricType.PROSPECCAO,
])

export async function getUserId(req: NextRequest) {
  const token = await getToken({ req, secret: getNextAuthSecret() })
  if (!token) return undefined

  const candidateIds = [token.userId, token.sub].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  )

  for (const candidateId of candidateIds) {
    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { id: true },
    })
    if (user) {
      return user.id
    }
  }

  const username = typeof token.username === 'string' ? token.username : undefined
  const email = typeof token.email === 'string' ? token.email : undefined

  if (!username && !email) return undefined

  const fallbackUser = await prisma.user.findFirst({
    where: {
      OR: [
        username ? { username } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as Array<{ username?: string; email?: string }>,
    },
    select: { id: true },
  })

  return fallbackUser?.id
}

// Helper to get the date string YYYY-MM-DD in Brazil timezone
function getBrazilDateString(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function startOfDay(date: Date) {
  const dateString = getBrazilDateString(date)
  // Construct ISO string for Midnight in Brazil (UTC-3)
  return new Date(`${dateString}T00:00:00-03:00`)
}

function endOfDay(date: Date) {
  const dateString = getBrazilDateString(date)
  // Construct ISO string for End of Day in Brazil (UTC-3)
  return new Date(`${dateString}T23:59:59.999-03:00`)
}

function startOfWeek(date: Date, weekStartsOn = 1) {
  // Get start of today in Brazil
  const current = startOfDay(date)
  // Get day of week (0-6) for this Brazil date. 
  // Since current corresponds to 03:00 UTC (or similar), getUTCDay() matches Brazil day.
  const day = current.getUTCDay()

  // Calculate difference to Monday (or weekStartsOn)
  // If today is Monday (1) and week starts Is Monday (1): diff = 0
  // If today is Sunday (0) and week starts is Monday (1): diff = 6 (should go back 6 days)
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn

  // Subtract days
  current.setUTCDate(current.getUTCDate() - diff)
  return current
}

function endOfWeek(date: Date, weekStartsOn = 1) {
  const start = startOfWeek(date, weekStartsOn)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)

  // Create end of day for that date
  // We can't just set hours because of potential DST shifts (though unlikely for Brazil now)
  // Easier: generate string from 'end' and make endOfDay.
  // Actually, 'end' is already aligned to Midnight Brazil.
  // just add 23h 59m 59s
  end.setUTCHours(end.getUTCHours() + 23)
  end.setUTCMinutes(59)
  end.setUTCSeconds(59)
  end.setUTCMilliseconds(999)
  return end
}

function startOfMonth(date: Date) {
  const dateString = getBrazilDateString(date)
  const [year, month] = dateString.split('-')
  // First day of month
  return new Date(`${year}-${month}-01T00:00:00-03:00`)
}

function endOfMonth(date: Date) {
  const start = startOfMonth(date)
  // Go to next month
  const nextMonth = new Date(start)
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
  // Subtract 1ms to get last instant of previous month? 
  // Or just -1 day
  const end = new Date(nextMonth)
  end.setUTCDate(0) // Last day of previous month

  // Align to end of day
  end.setUTCHours(2 + 23) // careful with base... 
  // Safest: use string manipulation again to avoid UTC math headaches
  const endString = getBrazilDateString(end)
  return new Date(`${endString}T23:59:59.999-03:00`)
}

export function parseDateInput(value: unknown, endOfDayValue = false) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const hasTime = value.includes('T')
  const normalized = hasTime
    ? value
    : `${value}${endOfDayValue ? 'T23:59:59.999' : 'T00:00:00.000'}-03:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function parseWeekDays(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const days = value
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v >= 0 && v <= 6)
  return Array.from(new Set(days))
}

function isAllowedDay(date: Date, weekDays: number[]) {
  if (!weekDays || weekDays.length === 0) return true
  return weekDays.includes(date.getDay())
}

async function countByDates<T extends { createdAt: Date }>(
  items: T[],
  weekDays: number[]
) {
  if (!weekDays || weekDays.length === 0) return items.length
  return items.filter((item) => isAllowedDay(item.createdAt, weekDays)).length
}

async function countByUpdated<T extends { updatedAt: Date }>(
  items: T[],
  weekDays: number[]
) {
  if (!weekDays || weekDays.length === 0) return items.length
  return items.filter((item) => isAllowedDay(item.updatedAt, weekDays)).length
}

export function getPeriodWindow(goal: {
  periodType: GoalPeriodType
  startDate?: Date | null
  endDate?: Date | null
}) {
  const now = new Date()
  const goalStart = goal.startDate ? startOfDay(goal.startDate) : null
  const goalEnd = goal.endDate ? endOfDay(goal.endDate) : null
  let periodStart = goalStart ?? startOfDay(now)
  let periodEnd = goalEnd ?? endOfDay(now)

  switch (goal.periodType) {
    case GoalPeriodType.DAILY:
      periodStart = startOfDay(now)
      periodEnd = endOfDay(now)
      break
    case GoalPeriodType.WEEKLY:
      periodStart = startOfWeek(now, 1)
      periodEnd = endOfWeek(now, 1)
      break
    case GoalPeriodType.MONTHLY:
      periodStart = startOfMonth(now)
      periodEnd = endOfMonth(now)
      break
    case GoalPeriodType.CUSTOM:
    default:
      periodStart = goalStart ?? startOfDay(now)
      periodEnd = goalEnd ?? endOfDay(now)
  }

  if (goalStart && periodStart < goalStart) periodStart = goalStart
  if (goalEnd && periodEnd > goalEnd) periodEnd = goalEnd

  const withinStart = !goalStart || now >= goalStart
  const withinEnd = !goalEnd || now <= goalEnd
  const active = periodStart <= periodEnd && withinStart && withinEnd
  return { periodStart, periodEnd, active }
}

export async function computeGoalProgress(goal: {
  metricType: GoalMetricType
  startDate?: Date | null
  endDate?: Date | null
  weekDays: number[]
  periodType: GoalPeriodType
  userId?: string
}) {
  const { metricType, startDate, endDate, weekDays, periodType, userId } = goal
  const { periodStart, periodEnd, active } = getPeriodWindow({
    periodType,
    startDate,
    endDate,
  })

  const baseWhere = userId ? { userId } : {}

  if (!active) {
    return { current: 0, periodStart, periodEnd, active }
  }

  if (metricType === GoalMetricType.CLIENTES_CADASTRADOS) {
    if (!weekDays || weekDays.length === 0) {
      const current = await prisma.cliente.count({
        where: { ...baseWhere, createdAt: { gte: periodStart, lte: periodEnd } },
      })
      return { current, periodStart, periodEnd, active }
    }

    const items = await prisma.cliente.findMany({
      select: { createdAt: true },
      where: { ...baseWhere, createdAt: { gte: periodStart, lte: periodEnd } },
    })
    const current = await countByDates(items, weekDays)
    return { current, periodStart, periodEnd, active }
  }

  if (metricType === GoalMetricType.CLIENTES_CONTATADOS) {
    if (!weekDays || weekDays.length === 0) {
      const current = await prisma.contato.count({
        where: { ...baseWhere, createdAt: { gte: periodStart, lte: periodEnd } },
      })
      return { current, periodStart, periodEnd, active }
    }

    const items = await prisma.contato.findMany({
      select: { createdAt: true },
      where: { ...baseWhere, createdAt: { gte: periodStart, lte: periodEnd } },
    })
    const current = await countByDates(items, weekDays)
    return { current, periodStart, periodEnd, active }
  }

  if (metricType === GoalMetricType.FATURAMENTO) {
    // Soma o valor das oportunidades fechadas no período
    if (!weekDays || weekDays.length === 0) {
      const result = await prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          ...baseWhere,
          status: 'fechada',
          updatedAt: { gte: periodStart, lte: periodEnd },
        },
      })
      const current = Math.round(result._sum.valor ?? 0)
      return { current, periodStart, periodEnd, active }
    }

    const items = await prisma.oportunidade.findMany({
      select: { updatedAt: true, valor: true },
      where: {
        ...baseWhere,
        status: 'fechada',
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    })
    const filtered = weekDays.length === 0
      ? items
      : items.filter((item) => isAllowedDay(item.updatedAt, weekDays))
    const current = Math.round(filtered.reduce((sum, item) => sum + (item.valor ?? 0), 0))
    return { current, periodStart, periodEnd, active }
  }

  if (metricsRequiringStatus.has(metricType)) {
    const canonicalStatuses = metricStatusMap[metricType]
    const statuses = canonicalStatuses
      ? expandOpportunityStatuses(canonicalStatuses)
      : undefined
    if (!statuses || statuses.length === 0) {
      return { current: 0, periodStart, periodEnd, active }
    }

    if (!weekDays || weekDays.length === 0) {
      const current = await prisma.oportunidade.count({
        where: {
          ...baseWhere,
          status: { in: statuses },
          updatedAt: { gte: periodStart, lte: periodEnd },
        },
      })
      return { current, periodStart, periodEnd, active }
    }

    const items = await prisma.oportunidade.findMany({
      select: { updatedAt: true },
      where: {
        ...baseWhere,
        status: { in: statuses },
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    })
    const current = await countByUpdated(items, weekDays)
    return { current, periodStart, periodEnd, active }
  }

  return { current: 0, periodStart, periodEnd, active }
}

export async function recordGoalSnapshot(params: {
  goalId: string
  target: number
  current: number
  progress: number
  periodStart: Date
  periodEnd: Date
  active: boolean
}) {
  const { goalId, target, current, progress, periodStart, periodEnd, active } = params

  if (!active) return

  try {
    await prisma.goalSnapshot.upsert({
      where: {
        goalId_periodStart_periodEnd: {
          goalId,
          periodStart,
          periodEnd,
        },
      },
      update: {
        current,
        target,
        progress,
      },
      create: {
        goalId,
        periodStart,
        periodEnd,
        current,
        target,
        progress,
      },
    })
  } catch (error) {
    console.warn('Nao foi possivel registrar snapshot da meta:', error)
  }
}
