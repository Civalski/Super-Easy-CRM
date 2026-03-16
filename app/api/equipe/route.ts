import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthIdentityFromRequest } from '@/lib/auth'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type TeamPeriod = 'day' | 'week' | 'month'

type TeamMetrics = {
  contatos: number
  tarefas: number
  orcamentos: number
  pedidos: number
  faturamento: number
}

type MemberSeed = {
  userId: string
  name: string | null
  username: string
}

function createEmptyMetrics(): TeamMetrics {
  return {
    contatos: 0,
    tarefas: 0,
    orcamentos: 0,
    pedidos: 0,
    faturamento: 0,
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toLookup(rows: Array<{ userId: string; total: unknown }>) {
  return new Map(rows.map((row) => [row.userId, toNumber(row.total)]))
}

function getPeriods(referenceDate: Date) {
  return {
    day: {
      start: startOfDay(referenceDate),
      end: endOfDay(referenceDate),
    },
    week: {
      start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
      end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
    },
    month: {
      start: startOfMonth(referenceDate),
      end: endOfMonth(referenceDate),
    },
  } satisfies Record<TeamPeriod, { start: Date; end: Date }>
}

async function buildPeriodMetrics(memberIds: string[], start: Date, end: Date) {
  const [contactsRows, taskRows, quoteRows, orderCountRows, revenueRows] = await Promise.all([
    prisma.prospecto.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        ultimoContato: { gte: start, lte: end },
      },
      _count: { _all: true },
    }),
    prisma.tarefa.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
    }),
    prisma.oportunidade.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
    }),
    prisma.pedido.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        createdAt: { gte: start, lte: end },
      },
      _count: { _all: true },
    }),
    prisma.pedido.groupBy({
      by: ['userId'],
      where: {
        userId: { in: memberIds },
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalLiquido: true },
    }),
  ])

  return {
    contatos: new Map(contactsRows.map((row) => [row.userId, row._count._all])),
    tarefas: new Map(taskRows.map((row) => [row.userId, row._count._all])),
    orcamentos: new Map(quoteRows.map((row) => [row.userId, row._count._all])),
    pedidos: new Map(orderCountRows.map((row) => [row.userId, row._count._all])),
    faturamento: toLookup(
      revenueRows.map((row) => ({
        userId: row.userId,
        total: row._sum.totalLiquido,
      }))
    ),
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (managerId) => {
    try {
      const { role } = await getAuthIdentityFromRequest(request)
      if (role !== 'manager') {
        return NextResponse.json({ error: 'Acesso restrito ao gerente.' }, { status: 403 })
      }

      const workspaces = await prisma.workspace.findMany({
        where: { ownerId: managerId },
        select: {
          id: true,
          name: true,
          members: {
            where: {
              userId: { not: managerId },
              role: 'vendedor',
              user: { role: 'user' },
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      })

      const memberMap = new Map<string, MemberSeed>()
      for (const workspace of workspaces) {
        for (const member of workspace.members) {
          memberMap.set(member.user.id, {
            userId: member.user.id,
            name: member.user.name,
            username: member.user.username,
          })
        }
      }

      const members = Array.from(memberMap.values())
      const referenceDate = new Date()
      const periods = getPeriods(referenceDate)

      if (members.length === 0) {
        return NextResponse.json({
          teamName: workspaces[0]?.name ?? null,
          generatedAt: referenceDate.toISOString(),
          members: [],
          totals: {
            day: createEmptyMetrics(),
            week: createEmptyMetrics(),
            month: createEmptyMetrics(),
          },
          periods: {
            day: {
              start: periods.day.start.toISOString(),
              end: periods.day.end.toISOString(),
            },
            week: {
              start: periods.week.start.toISOString(),
              end: periods.week.end.toISOString(),
            },
            month: {
              start: periods.month.start.toISOString(),
              end: periods.month.end.toISOString(),
            },
          },
        })
      }

      const memberIds = members.map((member) => member.userId)
      const periodKeys = Object.keys(periods) as TeamPeriod[]
      const metricsByPeriodEntries = await Promise.all(
        periodKeys.map(async (period) => {
          const { start, end } = periods[period]
          const metrics = await buildPeriodMetrics(memberIds, start, end)
          return [period, metrics] as const
        })
      )
      const metricsByPeriod = Object.fromEntries(metricsByPeriodEntries) as Record<
        TeamPeriod,
        Awaited<ReturnType<typeof buildPeriodMetrics>>
      >

      const totals: Record<TeamPeriod, TeamMetrics> = {
        day: createEmptyMetrics(),
        week: createEmptyMetrics(),
        month: createEmptyMetrics(),
      }

      const payloadMembers = members.map((member) => {
        const metrics = {
          day: createEmptyMetrics(),
          week: createEmptyMetrics(),
          month: createEmptyMetrics(),
        } satisfies Record<TeamPeriod, TeamMetrics>

        for (const period of periodKeys) {
          const periodMetrics = metricsByPeriod[period]
          metrics[period] = {
            contatos: periodMetrics.contatos.get(member.userId) ?? 0,
            tarefas: periodMetrics.tarefas.get(member.userId) ?? 0,
            orcamentos: periodMetrics.orcamentos.get(member.userId) ?? 0,
            pedidos: periodMetrics.pedidos.get(member.userId) ?? 0,
            faturamento: periodMetrics.faturamento.get(member.userId) ?? 0,
          }

          totals[period].contatos += metrics[period].contatos
          totals[period].tarefas += metrics[period].tarefas
          totals[period].orcamentos += metrics[period].orcamentos
          totals[period].pedidos += metrics[period].pedidos
          totals[period].faturamento += metrics[period].faturamento
        }

        return {
          userId: member.userId,
          name: member.name,
          username: member.username,
          metrics,
        }
      })

      return NextResponse.json({
        teamName: workspaces[0]?.name ?? null,
        generatedAt: referenceDate.toISOString(),
        members: payloadMembers,
        totals,
        periods: {
          day: {
            start: periods.day.start.toISOString(),
            end: periods.day.end.toISOString(),
          },
          week: {
            start: periods.week.start.toISOString(),
            end: periods.week.end.toISOString(),
          },
          month: {
            start: periods.month.start.toISOString(),
            end: periods.month.end.toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error)
      return NextResponse.json({ error: 'Erro ao carregar dados da equipe.' }, { status: 500 })
    }
  })
}
