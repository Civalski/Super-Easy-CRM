import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
} from 'date-fns'
import { expandOpportunityStatuses, mapOpportunityStatusForResponse } from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
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
      pedidosCount,
      pedidosSemPagamentoCount,
      pedidosSemPagamentoValorAgg,
      oportunidadesCount,
      orcamentosEmAbertoCount,
      orcamentosEmAbertoValorAgg,
      tarefasCount,
      valorGanhosAgg,
      valorPerdidosAgg,
      oportunidadesStatusGroups,
      tarefasStatusGroups,
      oportunidadesFechadasOuPerdidas,
    ] = await Promise.all([
      prisma.cliente.count({
        where: { userId, createdAt: dateFilter },
      }),
      prisma.pedido.count({
        where: { userId, createdAt: dateFilter },
      }),
      prisma.pedido.count({
        where: {
          userId,
          pagamentoConfirmado: false,
        },
      }),
      prisma.pedido.aggregate({
        _sum: { totalLiquido: true },
        where: {
          userId,
          pagamentoConfirmado: false,
          oportunidade: {
            is: {
              userId,
              status: {
                not: 'perdida',
              },
            },
          },
        },
      }),
      prisma.oportunidade.count({
        where: { userId, createdAt: dateFilter },
      }),
      prisma.oportunidade.count({
        where: {
          userId,
          status: { in: expandOpportunityStatuses(['orcamento']) },
          pedido: {
            is: null,
          },
        },
      }),
      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: { in: expandOpportunityStatuses(['orcamento']) },
          pedido: {
            is: null,
          },
        },
      }),
      prisma.tarefa.count({
        where: {
          userId,
          status: { in: ['pendente', 'em_andamento'] },
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

    const { dayKeys, seriesRange, isMonthByWeeks } = (() => {
      if (filter === 'day') {
        return { dayKeys: [] as string[], seriesRange: null as { gte: Date; lte: Date } | null, isMonthByWeeks: false }
      }
      if (filter === 'week') {
        const start = startOfDay(startOfWeek(referenceDate, { weekStartsOn: 1 }))
        const end = endOfDay(endOfWeek(referenceDate, { weekStartsOn: 1 }))
        const keys = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
        return { dayKeys: keys, seriesRange: { gte: start, lte: end }, isMonthByWeeks: false }
      }
      const monthStart = startOfMonth(referenceDate)
      const monthEnd = endOfMonth(referenceDate)
      const keys = ['S1', 'S2', 'S3', 'S4'].map((_, i) => {
        const day = i * 7 + 1
        const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(day, 28))
        return format(d, 'yyyy-MM-dd')
      })
      return {
        dayKeys: keys,
        seriesRange: { gte: startOfDay(monthStart), lte: endOfDay(monthEnd) },
        isMonthByWeeks: true,
      }
    })()

    const [
      vendasUltimos7Dias,
      perdidasUltimos7Dias,
      oportunidadesCriadas7Dias,
      oportunidadesFechadas7Dias,
      tarefasCriadas7Dias,
      contatosCriados7Dias,
    ] = seriesRange
      ? await Promise.all([
          prisma.oportunidade.findMany({
            where: {
              userId,
              status: 'fechada',
              updatedAt: seriesRange,
            },
            select: { valor: true, updatedAt: true },
          }),
          prisma.oportunidade.findMany({
            where: {
              userId,
              status: 'perdida',
              updatedAt: seriesRange,
            },
            select: { valor: true, updatedAt: true },
          }),
          prisma.oportunidade.findMany({
            where: { userId, createdAt: seriesRange },
            select: { clienteId: true, createdAt: true },
          }),
          prisma.oportunidade.findMany({
            where: {
              userId,
              status: 'fechada',
              updatedAt: seriesRange,
            },
            select: { clienteId: true, updatedAt: true },
          }),
          prisma.tarefa.findMany({
            where: { userId, clienteId: { not: null }, createdAt: seriesRange },
            select: { clienteId: true, createdAt: true },
          }),
          prisma.contato.findMany({
            where: { userId, createdAt: seriesRange },
            select: { clienteId: true, createdAt: true },
          }),
        ])
      : [[], [], [], [], [], []]
    const monthStart = isMonthByWeeks ? startOfMonth(referenceDate) : null

    const toBucketKey = (d: Date): string => {
      if (isMonthByWeeks && monthStart) {
        const dayOfMonth = d.getDate()
        const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3)
        const weekStartDay = weekIndex * 7 + 1
        return format(new Date(d.getFullYear(), d.getMonth(), weekStartDay), 'yyyy-MM-dd')
      }
      return format(d, 'yyyy-MM-dd')
    }

    const vendasPorDia = dayKeys.map((day) => ({ date: day, valor: 0 }))
    const orcamentosCanceladosPorDia = dayKeys.map((day) => ({ date: day, valor: 0 }))
    const contatosFeitosPorDia = dayKeys.map((day) => ({ date: day, count: 0 }))
    const vendasPorDiaMap = new Map(dayKeys.map((k, i) => [k, vendasPorDia[i]]))
    const perdidasPorDiaMap = new Map(dayKeys.map((k, i) => [k, orcamentosCanceladosPorDia[i]]))
    const contatosPorDiaMap = new Map<string, Set<string>>(dayKeys.map((k) => [k, new Set()]))

    for (const o of vendasUltimos7Dias) {
      const dayKey = toBucketKey(o.updatedAt)
      const bucket = vendasPorDiaMap.get(dayKey)
      if (bucket) bucket.valor += o.valor || 0
    }
    for (const o of perdidasUltimos7Dias) {
      const dayKey = toBucketKey(o.updatedAt)
      const bucket = perdidasPorDiaMap.get(dayKey)
      if (bucket) bucket.valor += o.valor || 0
    }
    for (const o of oportunidadesCriadas7Dias) {
      const dayKey = toBucketKey(o.createdAt)
      const set = contatosPorDiaMap.get(dayKey)
      if (set && o.clienteId) set.add(o.clienteId)
    }
    for (const o of oportunidadesFechadas7Dias) {
      const dayKey = toBucketKey(o.updatedAt)
      const set = contatosPorDiaMap.get(dayKey)
      if (set && o.clienteId) set.add(o.clienteId)
    }
    for (const t of tarefasCriadas7Dias) {
      const dayKey = toBucketKey(t.createdAt)
      const set = contatosPorDiaMap.get(dayKey)
      if (set && t.clienteId) set.add(t.clienteId)
    }
    for (const c of contatosCriados7Dias) {
      const dayKey = toBucketKey(c.createdAt)
      const set = contatosPorDiaMap.get(dayKey)
      if (set && c.clienteId) set.add(c.clienteId)
    }
    for (let i = 0; i < dayKeys.length; i++) {
      const set = contatosPorDiaMap.get(dayKeys[i])
      contatosFeitosPorDia[i].count = set?.size ?? 0
    }

    const valorGanhos = valorGanhosAgg._sum.valor || 0
    const valorPerdidos = valorPerdidosAgg._sum.valor || 0
    const pedidosSemPagamentoValor = pedidosSemPagamentoValorAgg._sum.totalLiquido || 0
    const orcamentosEmAbertoValor = orcamentosEmAbertoValorAgg._sum.valor || 0
    const valorEmAberto = Math.max(
      pedidosSemPagamentoValor + orcamentosEmAbertoValor,
      0
    )

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
      pedidosCount,
      pedidosSemPagamentoCount,
      pedidosSemPagamentoValor,
      oportunidadesCount,
      orcamentosEmAbertoCount,
      orcamentosEmAbertoValor,
      tarefasCount,
      valorTotal: valorEmAberto,
      valorGanhos,
      valorPerdidos,
      faturamentoPerdaSerie: monthlyBuckets,
      oportunidadesPorStatus,
      tarefasPorStatus,
      vendasPorDia,
      orcamentosCanceladosPorDia,
      contatosFeitosPorDia,
    })
    } catch (error) {
      console.error('Erro ao buscar estatisticas do dashboard:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar estatisticas do dashboard' },
        { status: 500 }
      )
    }
  })
}
