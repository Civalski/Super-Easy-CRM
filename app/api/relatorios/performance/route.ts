import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { getDateRangeFromQuery, getDaysBetween } from '../_shared'
import {
  expandOpportunityStatuses,
  OPEN_OPPORTUNITY_STATUSES,
  mapOpportunityStatusForResponse,
} from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

function computeRiskScore(params: {
  probabilidade: number
  updatedAt: Date
  proximaAcaoEm?: Date | null
}) {
  const now = new Date()
  const daysWithoutUpdate = getDaysBetween(params.updatedAt, now)
  const hasNextAction = Boolean(params.proximaAcaoEm)
  const nextActionOverdue =
    params.proximaAcaoEm ? params.proximaAcaoEm.getTime() < now.getTime() : false

  const inactivityScore = Math.min(45, daysWithoutUpdate * 1.6)
  const probabilityScore = Math.max(0, Math.min(35, (100 - params.probabilidade) * 0.35))
  const planningScore = hasNextAction ? (nextActionOverdue ? 20 : 0) : 20
  const score = Math.min(100, Math.round(inactivityScore + probabilityScore + planningScore))

  return {
    score,
    level: score >= 70 ? 'alto' : score >= 40 ? 'medio' : 'baixo',
    daysWithoutUpdate,
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const range = getDateRangeFromQuery(request)
    if ('error' in range) {
      return NextResponse.json({ error: range.error }, { status: 400 })
    }

    const dateFilter = { gte: range.startDate, lte: range.endDate }

    const [vendasFechadas, oportunidadesAbertas] = await Promise.all([
      prisma.oportunidade.findMany({
        where: {
          userId,
          status: { in: expandOpportunityStatuses(['fechada']) },
          dataFechamento: { not: null, gte: range.startDate, lte: range.endDate },
        },
        select: {
          id: true,
          titulo: true,
          createdAt: true,
          dataFechamento: true,
          valor: true,
        },
      }),
      prisma.oportunidade.findMany({
        where: {
          userId,
          status: { in: expandOpportunityStatuses(OPEN_OPPORTUNITY_STATUSES) },
        },
        select: {
          id: true,
          titulo: true,
          status: true,
          probabilidade: true,
          updatedAt: true,
          valor: true,
          proximaAcaoEm: true,
          canalProximaAcao: true,
          responsavelProximaAcao: true,
          cliente: {
            select: {
              nome: true,
            },
          },
        },
      }),
    ])

    const cicloDias =
      vendasFechadas.length > 0
        ? vendasFechadas.map((item) => {
            const dataFechamento = item.dataFechamento || item.createdAt
            return getDaysBetween(item.createdAt, dataFechamento)
          })
        : []

    const cicloMedio =
      cicloDias.length > 0
        ? Math.round((cicloDias.reduce((sum, value) => sum + value, 0) / cicloDias.length) * 10) /
          10
        : 0

    const cicloMin = cicloDias.length > 0 ? Math.min(...cicloDias) : 0
    const cicloMax = cicloDias.length > 0 ? Math.max(...cicloDias) : 0

    const oportunidadesEmRisco = oportunidadesAbertas
      .map((item) => {
        const risk = computeRiskScore({
          probabilidade: item.probabilidade,
          updatedAt: item.updatedAt,
          proximaAcaoEm: item.proximaAcaoEm,
        })

        return {
          id: item.id,
          titulo: item.titulo,
          cliente: item.cliente.nome,
          status: mapOpportunityStatusForResponse(item.status),
          valor: item.valor || 0,
          probabilidade: item.probabilidade,
          updatedAt: item.updatedAt.toISOString(),
          nextAction: item.proximaAcaoEm
            ? {
                at: item.proximaAcaoEm.toISOString(),
                channel: item.canalProximaAcao,
                owner: item.responsavelProximaAcao,
              }
            : null,
          riskScore: risk.score,
          riskLevel: risk.level,
          daysWithoutUpdate: risk.daysWithoutUpdate,
        }
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20)

    const ticketMedio =
      vendasFechadas.length > 0
        ? vendasFechadas.reduce((sum, item) => sum + Number(item.valor || 0), 0) / vendasFechadas.length
        : 0

    return NextResponse.json({
      period: {
        start: range.startDate.toISOString(),
        end: range.endDate.toISOString(),
      },
      metrics: {
        vendasFechadas: vendasFechadas.length,
        cicloMedioDias: cicloMedio,
        cicloMinDias: cicloMin,
        cicloMaxDias: cicloMax,
        ticketMedio: Math.round(ticketMedio * 100) / 100,
      },
      riskRanking: oportunidadesEmRisco,
      generatedAt: new Date().toISOString(),
    })
    } catch (error) {
      console.error('Erro ao gerar relatorio de performance:', error)
      return NextResponse.json(
        { error: 'Erro ao gerar relatorio de performance' },
        { status: 500 }
      )
    }
  })
}
