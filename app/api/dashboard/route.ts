import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns'
import { mapOpportunityStatusForResponse } from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filter = request.nextUrl.searchParams.get('filter')
    const dateParam = request.nextUrl.searchParams.get('date')
    const referenceDate = dateParam ? new Date(dateParam) : new Date()

    let startDate: Date
    let endDate: Date

    if (filter === 'day') {
      startDate = startOfDay(referenceDate)
      endDate = endOfDay(referenceDate)
    } else if (filter === 'week') {
      startDate = startOfWeek(referenceDate, { weekStartsOn: 1 })
      endDate = endOfWeek(referenceDate, { weekStartsOn: 1 })
    } else {
      startDate = startOfMonth(referenceDate)
      endDate = endOfMonth(referenceDate)
    }

    const dateFilter = {
      gte: startDate,
      lte: endDate,
    }

    const seriesStart = startOfMonth(subMonths(referenceDate, 5))
    const seriesEnd = endOfMonth(referenceDate)

    const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
      const monthDate = startOfMonth(subMonths(referenceDate, 5 - index))
      const month = format(monthDate, 'yyyy-MM')
      return { month, faturamento: 0, perda: 0 }
    })

    const monthlyByKey = new Map(monthlyBuckets.map((item) => [item.month, item]))

    const [
      clientesCount,
      oportunidadesCount,
      tarefasCount,
      valorTotalAgg,
      valorGanhosAgg,
      valorPerdidosAgg,
      oportunidadesStatusGroups,
      tarefasStatusGroups,
      oportunidadesFechadasOuPerdidas,
    ] = await Promise.all([
      prisma.cliente.count({
        where: { userId, createdAt: dateFilter },
      }),
      prisma.oportunidade.count({
        where: { userId, createdAt: dateFilter },
      }),
      prisma.tarefa.count({
        where: { userId, createdAt: dateFilter },
      }),

      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: { not: 'perdida' },
          createdAt: dateFilter,
        },
      }),

      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: 'fechada',
          updatedAt: dateFilter,
        },
      }),

      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: 'perdida',
          updatedAt: dateFilter,
        },
      }),

      prisma.oportunidade.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          userId,
          createdAt: dateFilter,
        },
      }),

      prisma.tarefa.groupBy({
        by: ['status'],
        _count: { status: true },
        where: {
          userId,
          createdAt: dateFilter,
        },
      }),

      prisma.oportunidade.findMany({
        where: {
          userId,
          updatedAt: { gte: seriesStart, lte: seriesEnd },
          status: { in: ['fechada', 'perdida'] },
        },
        select: {
          status: true,
          valor: true,
          updatedAt: true,
        },
      }),
    ])

    for (const oportunidade of oportunidadesFechadasOuPerdidas) {
      const status = mapOpportunityStatusForResponse(oportunidade.status)
      const monthKey = format(oportunidade.updatedAt, 'yyyy-MM')
      const bucket = monthlyByKey.get(monthKey)
      if (!bucket) continue

      const valor = oportunidade.valor || 0
      if (status === 'fechada') {
        bucket.faturamento += valor
      }
      if (status === 'perdida') {
        bucket.perda += valor
      }
    }

    const valorTotal = valorTotalAgg._sum.valor || 0
    const valorGanhos = valorGanhosAgg._sum.valor || 0
    const valorPerdidos = valorPerdidosAgg._sum.valor || 0

    const oportunidadesPorStatusMap = new Map<string, number>()
    for (const group of oportunidadesStatusGroups) {
      const normalizedStatus = mapOpportunityStatusForResponse(group.status) || 'desconhecido'
      const currentValue = oportunidadesPorStatusMap.get(normalizedStatus) || 0
      oportunidadesPorStatusMap.set(normalizedStatus, currentValue + group._count.status)
    }

    const oportunidadesPorStatus = Array.from(oportunidadesPorStatusMap.entries()).map(([status, count]) => ({
      status,
      _count: count,
    }))

    const tarefasPorStatus = tarefasStatusGroups.map((group) => ({
      status: group.status,
      _count: group._count.status,
    }))

    return NextResponse.json({
      clientesCount,
      oportunidadesCount,
      tarefasCount,
      valorTotal,
      valorGanhos,
      valorPerdidos,
      faturamentoPerdaSerie: monthlyBuckets,
      oportunidadesPorStatus,
      tarefasPorStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar estatisticas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatisticas do dashboard' },
      { status: 500 }
    )
  }
}
