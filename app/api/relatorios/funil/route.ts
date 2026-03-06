import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import {
  expandOpportunityStatuses,
  OpportunityStatus,
} from '@/lib/domain/status'
import { getDateRangeFromQuery } from '../_shared'

export const dynamic = 'force-dynamic'

async function countOportunidadesByStatus(
  userId: string,
  status: OpportunityStatus,
  dateFilter: { gte: Date; lte: Date }
) {
  const statuses = expandOpportunityStatuses([status])
  return prisma.oportunidade.count({
    where: {
      userId,
      status: { in: statuses },
      createdAt: dateFilter,
    },
  })
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const range = getDateRangeFromQuery(request)
    if ('error' in range) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }

    const dateFilter = { gte: range.startDate, lte: range.endDate }

    const [
      leadsSemContato,
      leadsContatados,
      leadsQualificados,
      semContato,
      emPotencial,
      orcamento,
      fechada,
      perdida,
    ] = await Promise.all([
      prisma.prospecto.count({
        where: {
          userId,
          status: 'novo',
          ultimoContato: { not: null },
          createdAt: dateFilter,
        },
      }),
      prisma.prospecto.count({
        where: {
          userId,
          status: 'em_contato',
          createdAt: dateFilter,
        },
      }),
      prisma.prospecto.count({
        where: {
          userId,
          status: 'qualificado',
          createdAt: dateFilter,
        },
      }),
      countOportunidadesByStatus(userId, 'sem_contato', dateFilter),
      countOportunidadesByStatus(userId, 'em_potencial', dateFilter),
      countOportunidadesByStatus(userId, 'orcamento', dateFilter),
      countOportunidadesByStatus(userId, 'fechada', dateFilter),
      countOportunidadesByStatus(userId, 'perdida', dateFilter),
    ])

    const etapaSemContato = leadsSemContato + semContato
    const etapaEmPotencial = leadsQualificados + emPotencial
    const etapaOrcamento = orcamento
    const etapaFechada = fechada
    const etapaPerdida = perdida
    const etapaContatado = leadsContatados

    const topoFunil = etapaSemContato + etapaContatado + etapaEmPotencial
    const totalOrcamentos = etapaOrcamento + etapaFechada + etapaPerdida
    const totalDecisoes = etapaFechada + etapaPerdida

    const leadToOrcamento = topoFunil > 0 ? (totalOrcamentos / topoFunil) * 100 : 0
    const orcamentoToVenda =
      totalOrcamentos > 0 ? (etapaFechada / totalOrcamentos) * 100 : 0
    const winRate = totalDecisoes > 0 ? (etapaFechada / totalDecisoes) * 100 : 0

    return NextResponse.json({
      period: {
        start: range.startDate.toISOString(),
        end: range.endDate.toISOString(),
      },
      stages: [
        { key: 'sem_contato', label: 'Sem contato', total: etapaSemContato },
        { key: 'contatado', label: 'Contatado', total: etapaContatado },
        { key: 'em_potencial', label: 'Em potencial', total: etapaEmPotencial },
        { key: 'orcamento', label: 'Orçamento', total: etapaOrcamento },
        { key: 'fechada', label: 'Fechada', total: etapaFechada },
        { key: 'perdida', label: 'Perdida', total: etapaPerdida },
      ],
      conversion: {
        leadToOrcamento: Math.round(leadToOrcamento * 10) / 10,
        orcamentoToVenda: Math.round(orcamentoToVenda * 10) / 10,
        winRate: Math.round(winRate * 10) / 10,
      },
    })
    } catch (error) {
      console.error('Erro ao gerar relatorio de funil:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar relatorio de funil' },
        { status: 500 }
      )
    }
  })
}
