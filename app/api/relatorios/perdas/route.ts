import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { getDateRangeFromQuery } from '../_shared'
import { expandOpportunityStatuses } from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const range = getDateRangeFromQuery(request)
    if ('error' in range) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }

    const dateFilter = { gte: range.startDate, lte: range.endDate }
    const perdidaStatuses = expandOpportunityStatuses(['perdida'])
    const fechadaStatuses = expandOpportunityStatuses(['fechada'])

    const [perdidas, fechadas] = await Promise.all([
      prisma.oportunidade.findMany({
        where: {
          userId,
          status: { in: perdidaStatuses },
          updatedAt: dateFilter,
        },
        select: {
          motivoPerda: true,
          valor: true,
        },
      }),
      prisma.oportunidade.count({
        where: {
          userId,
          status: { in: fechadaStatuses },
          updatedAt: dateFilter,
        },
      }),
    ])

    const totalPerdidas = perdidas.length
    const totalValorPerdido = perdidas.reduce((sum, item) => sum + Number(item.valor || 0), 0)
    const totalDecisoes = fechadas + totalPerdidas

    const motivosMap = new Map<string, { motivo: string; total: number; valor: number }>()

    for (const perda of perdidas) {
      const motivo = (perda.motivoPerda || 'Sem motivo informado').trim()
      const entry = motivosMap.get(motivo) || { motivo, total: 0, valor: 0 }
      entry.total += 1
      entry.valor += Number(perda.valor || 0)
      motivosMap.set(motivo, entry)
    }

    const motivos = Array.from(motivosMap.values())
      .map((item) => ({
        ...item,
        percentual: totalPerdidas > 0 ? Math.round((item.total / totalPerdidas) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      period: {
        start: range.startDate.toISOString(),
        end: range.endDate.toISOString(),
      },
      totals: {
        perdidas: totalPerdidas,
        fechadas,
        taxaPerda:
          totalDecisoes > 0
            ? Math.round((totalPerdidas / totalDecisoes) * 1000) / 10
            : 0,
        valorPerdido: Math.round(totalValorPerdido * 100) / 100,
      },
      motivos,
    })
    } catch (error) {
      console.error('Erro ao gerar relatorio de perdas:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar relatorio de perdas' },
        { status: 500 }
      )
    }
  })
}
