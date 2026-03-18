import { NextRequest, NextResponse } from 'next/server'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const dashboardSchema = z.object({
  metricas: z.union([z.string(), z.array(z.string())]), // can be a single string or array of strings
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

      const rawMetricas = Array.isArray(parsed.data.metricas) ? parsed.data.metricas : [parsed.data.metricas]
      const { data_inicio, data_fim } = parsed.data

      const startDate = new Date(`${data_inicio}T00:00:00.000Z`)
      const endDate = new Date(`${data_fim}T23:59:59.999Z`)

      // We will group data by Date formatted string
      type GroupedData = Record<string, any>
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

      for (const metrica of rawMetricas) {
        if (metrica === 'novos_clientes') {
          const clientes = await prisma.cliente.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          clientes.forEach(c => {
            const key = ensureDateKey(c.createdAt)
            groupedData[key]['novos_clientes'] = (groupedData[key]['novos_clientes'] || 0) + 1
          })
        } else if (metrica === 'orcamentos') {
          const orcamentos = await prisma.oportunidade.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          orcamentos.forEach(o => {
            const key = ensureDateKey(o.createdAt)
            groupedData[key]['orcamentos'] = (groupedData[key]['orcamentos'] || 0) + 1
          })
        } else if (metrica === 'pedidos') {
          const pedidos = await prisma.pedido.findMany({
            where: { userId, createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
          pedidos.forEach(p => {
            const key = ensureDateKey(p.createdAt)
            groupedData[key]['pedidos'] = (groupedData[key]['pedidos'] || 0) + 1
          })
        } else if (metrica === 'cancelados') {
          const orcamentosCancelados = await prisma.oportunidade.findMany({
            where: { userId, status: 'perdida', updatedAt: { gte: startDate, lte: endDate } },
            select: { updatedAt: true },
          })
          const pedidosCancelados = await prisma.pedido.findMany({
            where: { userId, statusEntrega: 'cancelado', updatedAt: { gte: startDate, lte: endDate } },
            select: { updatedAt: true },
          })
          
          orcamentosCancelados.forEach(o => {
            const key = ensureDateKey(o.updatedAt)
            groupedData[key]['cancelados'] = (groupedData[key]['cancelados'] || 0) + 1
          })
          pedidosCancelados.forEach(p => {
            const key = ensureDateKey(p.updatedAt)
            groupedData[key]['cancelados'] = (groupedData[key]['cancelados'] || 0) + 1
          })
        }
      }

      // Convertendo em array para o chart
      const chartData = Object.values(groupedData).sort((a, b) => {
        const splitA = a.name.split('/')
        const splitB = b.name.split('/')
        const dateA = new Date(`${splitA[2]}-${splitA[1]}-${splitA[0]}`).getTime()
        const dateB = new Date(`${splitB[2]}-${splitB[1]}-${splitB[0]}`).getTime()
        return dateA - dateB
      })

      // Fill missing metric fields with 0 so Recharts maps it correctly
      chartData.forEach(cd => {
        rawMetricas.forEach(m => {
          if (cd[m] === undefined) cd[m] = 0
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
