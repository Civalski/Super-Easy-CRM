import { NextRequest, NextResponse } from 'next/server'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { expandOpportunityStatuses } from '@/lib/domain/status'

const metricaSchema = z.enum([
  'novos_clientes',
  'orcamentos',
  'pedidos',
  'cancelados',
  'oportunidades_fechadas',
  'oportunidades_perdidas',
  'receita_pedidos',
  'receita_fechamentos',
  'pedidos_pagos',
  'ticket_medio_pedido',
])

const dashboardSchema = z.object({
  metricas: z.array(metricaSchema).min(1),
  data_inicio: z.string(), // YYYY-MM-DD
  data_fim: z.string(), // YYYY-MM-DD
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      
      const parsed = dashboardSchema.safeParse({
        metricas: searchParams.getAll('metricas'),
        data_inicio: searchParams.get('data_inicio'),
        data_fim: searchParams.get('data_fim'),
      })

      if (!parsed.success) {
        return zodErrorResponse(parsed.error)
      }

      const rawMetricas = parsed.data.metricas
      const { data_inicio, data_fim } = parsed.data

      const startDate = new Date(`${data_inicio}T00:00:00.000Z`)
      const endDate = new Date(`${data_fim}T23:59:59.999Z`)

      // We will group data by Date formatted string
      type GroupedData = Record<string, Record<string, string | number>>
      const groupedData: GroupedData = {}

      const ensureDateKey = (dateObj: Date) => {
        const day = String(dateObj.getUTCDate()).padStart(2, '0')
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
        const year = dateObj.getUTCFullYear()
        const key = `${day}/${month}/${year}`
        if (!groupedData[key]) {
          groupedData[key] = { name: key }
        }
        return key
      }

      const addMetricValue = (date: Date, metrica: z.infer<typeof metricaSchema>, value: number) => {
        const key = ensureDateKey(date)
        groupedData[key][metrica] = (Number(groupedData[key][metrica]) || 0) + value
      }

      for (const metrica of rawMetricas) {
        if (metrica === 'novos_clientes') {
          const clientes = await prisma.cliente.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          clientes.forEach(c => addMetricValue(c.createdAt, 'novos_clientes', 1))
        } else if (metrica === 'orcamentos') {
          const orcamentos = await prisma.oportunidade.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          orcamentos.forEach(o => addMetricValue(o.createdAt, 'orcamentos', 1))
        } else if (metrica === 'pedidos') {
          const pedidos = await prisma.pedido.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          pedidos.forEach(p => addMetricValue(p.createdAt, 'pedidos', 1))
        } else if (metrica === 'cancelados') {
          const perdidaStatuses = expandOpportunityStatuses(['perdida'])
          const orcamentosCancelados = await prisma.oportunidade.findMany({
            where: { userId, status: { in: perdidaStatuses }, updatedAt: { gte: startDate, lte: endDate } },
            select: { updatedAt: true },
          })
          const pedidosCancelados = await prisma.pedido.findMany({
            where: { userId, statusEntrega: 'cancelado', updatedAt: { gte: startDate, lte: endDate } },
            select: { updatedAt: true },
          })

          orcamentosCancelados.forEach(o => addMetricValue(o.updatedAt, 'cancelados', 1))
          pedidosCancelados.forEach(p => addMetricValue(p.updatedAt, 'cancelados', 1))
        } else if (metrica === 'oportunidades_fechadas') {
          const fechadaStatuses = expandOpportunityStatuses(['fechada'])
          const oportunidadesFechadas = await prisma.oportunidade.findMany({
            where: {
              userId,
              status: { in: fechadaStatuses },
              dataFechamento: { not: null, gte: startDate, lte: endDate },
            },
            select: { dataFechamento: true },
          })
          oportunidadesFechadas.forEach(item => {
            if (!item.dataFechamento) return
            addMetricValue(item.dataFechamento, 'oportunidades_fechadas', 1)
          })
        } else if (metrica === 'oportunidades_perdidas') {
          const perdidaStatuses = expandOpportunityStatuses(['perdida'])
          const oportunidadesPerdidas = await prisma.oportunidade.findMany({
            where: {
              userId,
              status: { in: perdidaStatuses },
              updatedAt: { gte: startDate, lte: endDate },
            },
            select: { updatedAt: true },
          })
          oportunidadesPerdidas.forEach(item =>
            addMetricValue(item.updatedAt, 'oportunidades_perdidas', 1)
          )
        } else if (metrica === 'receita_pedidos') {
          const pedidos = await prisma.pedido.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true, totalLiquido: true },
          })
          pedidos.forEach(item =>
            addMetricValue(item.createdAt, 'receita_pedidos', Math.round(Number(item.totalLiquido || 0) * 100) / 100)
          )
        } else if (metrica === 'receita_fechamentos') {
          const fechadaStatuses = expandOpportunityStatuses(['fechada'])
          const oportunidades = await prisma.oportunidade.findMany({
            where: {
              userId,
              status: { in: fechadaStatuses },
              dataFechamento: { not: null, gte: startDate, lte: endDate },
            },
            select: { dataFechamento: true, valor: true },
          })
          oportunidades.forEach(item => {
            if (!item.dataFechamento) return
            addMetricValue(item.dataFechamento, 'receita_fechamentos', Math.round(Number(item.valor || 0) * 100) / 100)
          })
        } else if (metrica === 'pedidos_pagos') {
          const pedidosPagos = await prisma.pedido.findMany({
            where: {
              userId,
              pagamentoConfirmado: true,
              updatedAt: { gte: startDate, lte: endDate },
            },
            select: { updatedAt: true },
          })
          pedidosPagos.forEach(item => addMetricValue(item.updatedAt, 'pedidos_pagos', 1))
        } else if (metrica === 'ticket_medio_pedido') {
          const pedidos = await prisma.pedido.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true, totalLiquido: true },
          })

          const groupedByDay = new Map<string, { date: Date; sum: number; count: number }>()
          pedidos.forEach(item => {
            const dateKey = ensureDateKey(item.createdAt)
            const current = groupedByDay.get(dateKey) || { date: item.createdAt, sum: 0, count: 0 }
            current.sum += Number(item.totalLiquido || 0)
            current.count += 1
            groupedByDay.set(dateKey, current)
          })

          groupedByDay.forEach(({ date, sum, count }) => {
            const media = count > 0 ? sum / count : 0
            addMetricValue(date, 'ticket_medio_pedido', Math.round(media * 100) / 100)
          })
        }
      }

      // Convertendo em array para o chart
      const chartData = Object.values(groupedData).sort((a, b) => {
        const splitA = String(a.name).split('/')
        const splitB = String(b.name).split('/')
        const dateA = new Date(`${splitA[2]}-${splitA[1]}-${splitA[0]}`).getTime()
        const dateB = new Date(`${splitB[2]}-${splitB[1]}-${splitB[0]}`).getTime()
        return dateA - dateB
      })

      // Fill missing metric fields with 0 so Recharts maps it correctly
      chartData.forEach(cd => {
        rawMetricas.forEach(m => {
          if (cd[m] === undefined) {
            cd[m] = 0
          }
        })
      })

      return NextResponse.json(chartData)

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do dashboard' },
        { status: 500 }
      )
    }
  })
}
