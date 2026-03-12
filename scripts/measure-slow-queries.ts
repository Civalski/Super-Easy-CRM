import { performance } from 'node:perf_hooks'
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { expandOpportunityStatuses } from '@/lib/domain/status'

type BenchmarkEntry = {
  label: string
  ms: number
}

async function measure(label: string, fn: () => Promise<unknown>): Promise<BenchmarkEntry> {
  const start = performance.now()
  await fn()
  const ms = performance.now() - start
  console.log(`[measure] ${label}: ${ms.toFixed(1)}ms`)
  return { label, ms }
}

async function resolveTargetUserId() {
  const userWithDeals = await prisma.user.findFirst({
    where: {
      oportunidades: {
        some: {},
      },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  if (userWithDeals?.id) {
    return userWithDeals.id
  }

  const user = await prisma.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  return user?.id
}

async function runDashboardBundle(userId: string, referenceDate: Date) {
  const startDate = startOfMonth(referenceDate)
  const endDate = endOfMonth(referenceDate)
  const dateFilter = {
    gte: startDate,
    lte: endDate,
  }
  const seriesStart = startOfMonth(subMonths(referenceDate, 5))
  const seriesEnd = endOfMonth(referenceDate)
  const weekRange = {
    gte: startOfDay(startOfWeek(referenceDate, { weekStartsOn: 1 })),
    lte: endOfDay(endOfWeek(referenceDate, { weekStartsOn: 1 })),
  }
  const monthRange = {
    gte: startOfDay(startOfMonth(referenceDate)),
    lte: endOfDay(endOfMonth(referenceDate)),
  }
  const orcamentoStatuses = expandOpportunityStatuses(['orcamento'])

  await measure('dashboard:core-old-prisma-bundle', () =>
    Promise.all([
      prisma.cliente.count({ where: { userId, createdAt: dateFilter } }),
      prisma.pedido.count({ where: { userId, createdAt: dateFilter } }),
      prisma.pedido.count({ where: { userId, pagamentoConfirmado: false } }),
      prisma.pedido.aggregate({
        _sum: { totalLiquido: true },
        where: {
          userId,
          pagamentoConfirmado: false,
          oportunidade: {
            is: {
              userId,
              status: { not: 'perdida' },
            },
          },
        },
      }),
      prisma.oportunidade.count({ where: { userId, createdAt: dateFilter } }),
      prisma.oportunidade.count({
        where: {
          userId,
          status: { in: expandOpportunityStatuses(['orcamento']) },
          pedido: { is: null },
        },
      }),
      prisma.oportunidade.aggregate({
        _sum: { valor: true },
        where: {
          userId,
          status: { in: expandOpportunityStatuses(['orcamento']) },
          pedido: { is: null },
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
          pedido: { is: null },
          updatedAt: dateFilter,
        },
      }),
      prisma.pedido.aggregate({
        _sum: { totalLiquido: true },
        where: {
          userId,
          oportunidade: {
            is: {
              userId,
              status: 'perdida',
              updatedAt: dateFilter,
            },
          },
        },
      }),
      prisma.oportunidade.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { userId, createdAt: dateFilter },
      }),
      prisma.tarefa.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { userId, createdAt: dateFilter },
      }),
      prisma.oportunidade.findMany({
        where: {
          userId,
          updatedAt: { gte: seriesStart, lte: seriesEnd },
          status: { in: ['fechada', 'perdida'] },
        },
        select: { status: true, valor: true, updatedAt: true },
      }),
    ])
  )

  await measure('dashboard:core-new-queryraw', () =>
    prisma.$queryRaw(
      Prisma.sql`
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
      `
    )
  )

  await measure('dashboard:status-groups-old-groupby', () =>
    Promise.all([
      prisma.oportunidade.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { userId, createdAt: dateFilter },
      }),
      prisma.tarefa.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { userId, createdAt: dateFilter },
      }),
    ])
  )

  await measure('dashboard:status-groups-new-queryraw', () =>
    prisma.$queryRaw(
      Prisma.sql`
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
      `
    )
  )

  await measure('dashboard:weekly-series', () =>
    Promise.all([
      prisma.oportunidade.findMany({
        where: { userId, status: 'fechada', updatedAt: weekRange },
        select: { valor: true, updatedAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, status: 'perdida', updatedAt: weekRange },
        select: { valor: true, updatedAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, createdAt: weekRange },
        select: { clienteId: true, createdAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, status: 'fechada', updatedAt: weekRange },
        select: { clienteId: true, updatedAt: true },
      }),
      prisma.tarefa.findMany({
        where: { userId, clienteId: { not: null }, createdAt: weekRange },
        select: { clienteId: true, createdAt: true },
      }),
      prisma.contato.findMany({
        where: { userId, createdAt: weekRange },
        select: { clienteId: true, createdAt: true },
      }),
    ])
  )

  await measure('dashboard:monthly-series', () =>
    Promise.all([
      prisma.oportunidade.findMany({
        where: { userId, status: 'fechada', updatedAt: monthRange },
        select: { valor: true, updatedAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, status: 'perdida', updatedAt: monthRange },
        select: { valor: true, updatedAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, createdAt: monthRange },
        select: { clienteId: true, createdAt: true },
      }),
      prisma.oportunidade.findMany({
        where: { userId, status: 'fechada', updatedAt: monthRange },
        select: { clienteId: true, updatedAt: true },
      }),
      prisma.tarefa.findMany({
        where: { userId, clienteId: { not: null }, createdAt: monthRange },
        select: { clienteId: true, createdAt: true },
      }),
      prisma.contato.findMany({
        where: { userId, createdAt: monthRange },
        select: { clienteId: true, createdAt: true },
      }),
    ])
  )
}

async function runFluxoBundle(userId: string, months: number) {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  await measure(`fluxo:${months}m:geral`, () =>
    Promise.all([
      prisma.movimentoFinanceiro.findMany({
        where: {
          userId,
          contaReceber: { ambiente: 'geral' },
          dataMovimento: { gte: from, lte: to },
        },
        select: { dataMovimento: true, tipo: true, valor: true },
      }),
      prisma.contaReceber.findMany({
        where: {
          userId,
          ambiente: 'geral',
          status: { in: ['pendente', 'parcial', 'atrasado'] },
          dataVencimento: { gte: from, lte: to },
        },
        select: { tipo: true, dataVencimento: true, valorTotal: true, valorRecebido: true },
      }),
      prisma.oportunidade.findMany({
        where: {
          userId,
          status: 'fechada',
          updatedAt: { gte: from, lte: to },
          contasReceber: { none: {} },
        },
        select: { updatedAt: true, valor: true },
      }),
    ])
  )
}

async function main() {
  const userId = await resolveTargetUserId()
  if (!userId) {
    console.log('[measure] No users found in database.')
    return
  }

  console.log(`[measure] Target user: ${userId}`)
  const referenceDate = new Date()

  await runDashboardBundle(userId, referenceDate)
  await runFluxoBundle(userId, 6)
  await runFluxoBundle(userId, 12)
}

main()
  .catch((error) => {
    console.error('[measure] failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
