import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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

type DashboardFilter = 'day' | 'week' | 'month'

type DashboardCacheEntry = {
  expiresAt: number
  payload: unknown
}

type DashboardCoreMetricsRow = {
  clientesCount: bigint | number | null
  pedidosCount: bigint | number | null
  pedidosSemPagamentoCount: bigint | number | null
  pedidosSemPagamentoValor: number | string | null
  oportunidadesCount: bigint | number | null
  orcamentosEmAbertoCount: bigint | number | null
  orcamentosEmAbertoValor: number | string | null
  tarefasCount: bigint | number | null
  valorGanhos: number | string | null
  valorOrcamentosCancelados: number | string | null
  valorPedidosCancelados: number | string | null
}

type DashboardStatusGroupRow = {
  groupType: 'oportunidade' | 'tarefa' | string
  status: string | null
  total: bigint | number | null
}

const DASHBOARD_CACHE_TTL_MS = 15_000
const DASHBOARD_CACHE_MAX_ENTRIES = 600
const dashboardCache = new Map<string, DashboardCacheEntry>()

function normalizeDashboardFilter(rawFilter: string | null): DashboardFilter {
  if (rawFilter === 'day' || rawFilter === 'week') return rawFilter
  return 'month'
}

function getDashboardCachePeriodKey(filter: DashboardFilter, date: Date): string {
  if (filter === 'day') return format(date, 'yyyy-MM-dd')
  if (filter === 'week') return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  return format(date, 'yyyy-MM')
}

function pruneDashboardCache(now: number) {
  dashboardCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) dashboardCache.delete(key)
  })

  if (dashboardCache.size <= DASHBOARD_CACHE_MAX_ENTRIES) return

  const overflow = dashboardCache.size - DASHBOARD_CACHE_MAX_ENTRIES
  let removed = 0

  for (const key of Array.from(dashboardCache.keys())) {
    dashboardCache.delete(key)
    removed += 1
    if (removed >= overflow) break
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const filter = normalizeDashboardFilter(request.nextUrl.searchParams.get('filter'))
      const dateParam = request.nextUrl.searchParams.get('date')
      const parsedDate = dateParam ? new Date(dateParam) : new Date()
      const referenceDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate

      const now = Date.now()
      const cacheKey = `${userId}:${filter}:${getDashboardCachePeriodKey(filter, referenceDate)}`
      const cachedEntry = dashboardCache.get(cacheKey)
      if (cachedEntry && cachedEntry.expiresAt > now) {
        return NextResponse.json(cachedEntry.payload)
      }

      if (dashboardCache.size > DASHBOARD_CACHE_MAX_ENTRIES) {
        pruneDashboardCache(now)
      }

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

      const seriesStart = startOfMonth(subMonths(referenceDate, 5))
      const seriesEnd = endOfMonth(referenceDate)

      const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
        const monthDate = startOfMonth(subMonths(referenceDate, 5 - index))
        const month = format(monthDate, 'yyyy-MM')
        return { month, faturamento: 0, perda: 0 }
      })

      const monthlyByKey = new Map(monthlyBuckets.map((item) => [item.month, item]))
      const orcamentoStatuses = expandOpportunityStatuses(['orcamento'])

      const [
        coreMetricsRows,
        statusGroupsRows,
        oportunidadesFechadasOuPerdidas,
      ] = await Promise.all([
        prisma.$queryRaw<DashboardCoreMetricsRow[]>(Prisma.sql`
          SELECT
            (SELECT COUNT(*) FROM "clientes" c
              WHERE c."userId" = ${userId}
                AND c."createdAt" >= ${startDate}
                AND c."createdAt" <= ${endDate}
            ) AS "clientesCount",
            (SELECT COUNT(*) FROM "pedidos" p
              WHERE p."userId" = ${userId}
                AND p."createdAt" >= ${startDate}
                AND p."createdAt" <= ${endDate}
            ) AS "pedidosCount",
            (SELECT COUNT(*) FROM "pedidos" p
              WHERE p."userId" = ${userId}
                AND p."pagamentoConfirmado" = false
            ) AS "pedidosSemPagamentoCount",
            (SELECT COALESCE(SUM(p."totalLiquido"), 0) FROM "pedidos" p
              INNER JOIN "oportunidades" o
                ON o."id" = p."oportunidadeId"
               AND o."userId" = p."userId"
              WHERE p."userId" = ${userId}
                AND p."pagamentoConfirmado" = false
                AND o."status" <> 'perdida'
            ) AS "pedidosSemPagamentoValor",
            (SELECT COUNT(*) FROM "oportunidades" o
              WHERE o."userId" = ${userId}
                AND o."createdAt" >= ${startDate}
                AND o."createdAt" <= ${endDate}
            ) AS "oportunidadesCount",
            (SELECT COUNT(*) FROM "oportunidades" o
              LEFT JOIN "pedidos" p
                ON p."oportunidadeId" = o."id"
               AND p."userId" = o."userId"
              WHERE o."userId" = ${userId}
                AND o."status" IN (${Prisma.join(
                  orcamentoStatuses.map((status) => Prisma.sql`${status}`)
                )})
                AND p."id" IS NULL
            ) AS "orcamentosEmAbertoCount",
            (SELECT COALESCE(SUM(o."valor"), 0) FROM "oportunidades" o
              LEFT JOIN "pedidos" p
                ON p."oportunidadeId" = o."id"
               AND p."userId" = o."userId"
              WHERE o."userId" = ${userId}
                AND o."status" IN (${Prisma.join(
                  orcamentoStatuses.map((status) => Prisma.sql`${status}`)
                )})
                AND p."id" IS NULL
            ) AS "orcamentosEmAbertoValor",
            (SELECT COUNT(*) FROM "tarefas" t
              WHERE t."userId" = ${userId}
                AND t."status" IN ('pendente', 'em_andamento')
            ) AS "tarefasCount",
            (SELECT COALESCE(SUM(o."valor"), 0) FROM "oportunidades" o
              WHERE o."userId" = ${userId}
                AND o."status" = 'fechada'
                AND o."updatedAt" >= ${startDate}
                AND o."updatedAt" <= ${endDate}
            ) AS "valorGanhos",
            (SELECT COALESCE(SUM(o."valor"), 0) FROM "oportunidades" o
              LEFT JOIN "pedidos" p
                ON p."oportunidadeId" = o."id"
               AND p."userId" = o."userId"
              WHERE o."userId" = ${userId}
                AND o."status" = 'perdida'
                AND o."updatedAt" >= ${startDate}
                AND o."updatedAt" <= ${endDate}
                AND p."id" IS NULL
            ) AS "valorOrcamentosCancelados",
            (SELECT COALESCE(SUM(p."totalLiquido"), 0) FROM "pedidos" p
              INNER JOIN "oportunidades" o
                ON o."id" = p."oportunidadeId"
               AND o."userId" = p."userId"
              WHERE p."userId" = ${userId}
                AND o."status" = 'perdida'
                AND o."updatedAt" >= ${startDate}
                AND o."updatedAt" <= ${endDate}
            ) AS "valorPedidosCancelados"
        `),
        prisma.$queryRaw<DashboardStatusGroupRow[]>(Prisma.sql`
          WITH "oportunidadesStatusGroups" AS (
            SELECT
              'oportunidade' AS "groupType",
              o."status" AS "status",
              COUNT(*) AS "total"
            FROM "oportunidades" o
            WHERE o."userId" = ${userId}
              AND o."createdAt" >= ${startDate}
              AND o."createdAt" <= ${endDate}
            GROUP BY o."status"
          ),
          "tarefasStatusGroups" AS (
            SELECT
              'tarefa' AS "groupType",
              t."status" AS "status",
              COUNT(*) AS "total"
            FROM "tarefas" t
            WHERE t."userId" = ${userId}
              AND t."createdAt" >= ${startDate}
              AND t."createdAt" <= ${endDate}
            GROUP BY t."status"
          )
          SELECT * FROM "oportunidadesStatusGroups"
          UNION ALL
          SELECT * FROM "tarefasStatusGroups"
        `),
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

      const coreMetrics = coreMetricsRows[0]
      const clientesCount = toNumber(coreMetrics?.clientesCount)
      const pedidosCount = toNumber(coreMetrics?.pedidosCount)
      const pedidosSemPagamentoCount = toNumber(coreMetrics?.pedidosSemPagamentoCount)
      const pedidosSemPagamentoValor = toNumber(coreMetrics?.pedidosSemPagamentoValor)
      const oportunidadesCount = toNumber(coreMetrics?.oportunidadesCount)
      const orcamentosEmAbertoCount = toNumber(coreMetrics?.orcamentosEmAbertoCount)
      const orcamentosEmAbertoValor = toNumber(coreMetrics?.orcamentosEmAbertoValor)
      const tarefasCount = toNumber(coreMetrics?.tarefasCount)
      const valorGanhos = toNumber(coreMetrics?.valorGanhos)
      const valorOrcamentosCancelados = toNumber(coreMetrics?.valorOrcamentosCancelados)
      const valorPedidosCancelados = toNumber(coreMetrics?.valorPedidosCancelados)

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

    const valorPerdidos = valorOrcamentosCancelados + valorPedidosCancelados
    const valorEmAberto = Math.max(
      pedidosSemPagamentoValor + orcamentosEmAbertoValor,
      0
    )

    const oportunidadesPorStatusMap = new Map<string, number>()
    const tarefasPorStatusMap = new Map<string, number>()

    for (const group of statusGroupsRows) {
      if (!group.status) continue
      const total = toNumber(group.total)

      if (group.groupType === 'oportunidade') {
        const normalizedStatus = mapOpportunityStatusForResponse(group.status) || 'desconhecido'
        const currentValue = oportunidadesPorStatusMap.get(normalizedStatus) || 0
        oportunidadesPorStatusMap.set(normalizedStatus, currentValue + total)
        continue
      }

      if (group.groupType === 'tarefa') {
        const currentValue = tarefasPorStatusMap.get(group.status) || 0
        tarefasPorStatusMap.set(group.status, currentValue + total)
      }
    }

    const oportunidadesPorStatus = Array.from(oportunidadesPorStatusMap.entries()).map(([status, count]) => ({
      status,
      _count: count,
    }))

    const tarefasPorStatus = Array.from(tarefasPorStatusMap.entries()).map(([status, count]) => ({
      status,
      _count: count,
    }))

      const payload = {
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
      }

      dashboardCache.set(cacheKey, {
        payload,
        expiresAt: now + DASHBOARD_CACHE_TTL_MS,
      })

      return NextResponse.json(payload)
    } catch (error) {
      console.error('Erro ao buscar estatisticas do dashboard:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar estatisticas do dashboard' },
        { status: 500 }
      )
    }
  })
}
