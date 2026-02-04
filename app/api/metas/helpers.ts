import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { GoalMetricType, GoalPeriodType } from '@prisma/client'

const metricStatusMap: Partial<Record<GoalMetricType, string>> = {
  PROPOSTAS: 'proposta',
  VENDAS: 'fechada',
  QUALIFICACAO: 'qualificacao',
  NEGOCIACAO: 'negociacao',
  PROSPECCAO: 'prospeccao',
}

const metricsRequiringStatus = new Set<GoalMetricType>([
  GoalMetricType.PROPOSTAS,
  GoalMetricType.VENDAS,
  GoalMetricType.QUALIFICACAO,
  GoalMetricType.NEGOCIACAO,
  GoalMetricType.PROSPECCAO,
])

export async function getUserId(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
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

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function startOfWeek(date: Date, weekStartsOn = 1) {
  const value = startOfDay(date)
  const day = value.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  value.setDate(value.getDate() - diff)
  return value
}

function endOfWeek(date: Date, weekStartsOn = 1) {
  const start = startOfWeek(date, weekStartsOn)
  const value = new Date(start)
  value.setDate(start.getDate() + 6)
  return endOfDay(value)
}

function startOfMonth(date: Date) {
  const value = new Date(date)
  value.setDate(1)
  return startOfDay(value)
}

function endOfMonth(date: Date) {
  const value = new Date(date)
  value.setMonth(value.getMonth() + 1, 0)
  return endOfDay(value)
}

export function parseDateInput(value: unknown, endOfDayValue = false) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const hasTime = value.includes('T')
  const normalized = hasTime
    ? value
    : `${value}${endOfDayValue ? 'T23:59:59.999' : 'T00:00:00.000'}`
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

  if (metricsRequiringStatus.has(metricType)) {
    const status = metricStatusMap[metricType]
    if (!status) return { current: 0, periodStart, periodEnd, active }

    if (!weekDays || weekDays.length === 0) {
      const current = await prisma.oportunidade.count({
        where: {
          ...baseWhere,
          status,
          updatedAt: { gte: periodStart, lte: periodEnd },
        },
      })
      return { current, periodStart, periodEnd, active }
    }

    const items = await prisma.oportunidade.findMany({
      select: { updatedAt: true },
      where: {
        ...baseWhere,
        status,
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
