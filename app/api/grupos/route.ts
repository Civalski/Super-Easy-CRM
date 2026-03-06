import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import {
    mapOpportunityStatusForResponse,
    normalizeOpportunityStatus,
    expandOpportunityStatuses,
} from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

function parsePage(value: string | null, fallback = 1) {
    if (!value) return fallback
    const parsed = Number(value)
    if (!Number.isInteger(parsed)) return fallback
    return Math.max(1, parsed)
}

function parseLimit(value: string | null, fallback = 10, max = 50) {
    if (!value) return fallback
    const parsed = Number(value)
    if (!Number.isInteger(parsed)) return fallback
    return Math.min(max, Math.max(1, parsed))
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parsePage(searchParams.get('page'))
        const limit = parseLimit(searchParams.get('limit'))
        const skip = (page - 1) * limit

        if (!status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            )
        }

        const normalizedStatus = normalizeOpportunityStatus(status) || status

        let data = []
        let total = 0

        // Mapping of frontend listing status to logic
        // sem_contato -> Prospecto (lead_frio e novo)
        // contatado -> Prospecto (em_contato)
        // em_potencial -> Prospecto (qualificado)
        // others -> Oportunidade
        if (normalizedStatus === 'sem_contato' || normalizedStatus === 'contatado' || normalizedStatus === 'em_potencial') {
            const prospectoStatus = normalizedStatus === 'sem_contato'
                ? 'sem_contato'
                : normalizedStatus === 'contatado'
                    ? 'em_contato'
                    : 'qualificado'

            const whereProspecto: Record<string, unknown> =
                prospectoStatus === 'sem_contato'
                    ? {
                        userId,
                        OR: [{ status: 'lead_frio' }, { status: 'novo' }],
                    }
                    : {
                        userId,
                        status: prospectoStatus,
                    }

            const [prospectos, count] = await prisma.$transaction([
                prisma.prospecto.findMany({
                    where: whereProspecto,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.prospecto.count({ where: whereProspecto }),
            ])

            data = prospectos.map((p) => ({
                id: p.id,
                titulo: p.nomeFantasia || p.razaoSocial,
                valor: null,
                status: normalizedStatus,
                subStatus: p.status,
                createdAt: p.createdAt.toISOString(),
                type: 'prospecto',
                cliente: {
                    nome: p.nomeFantasia || p.razaoSocial,
                    email: p.email,
                    telefone: p.telefone1,
                    empresa: p.razaoSocial,
                    cnpj: p.cnpj,
                },
            }))
            total = count
        } else {
            const statusFilter = normalizeOpportunityStatus(normalizedStatus)
                ? expandOpportunityStatuses([normalizeOpportunityStatus(normalizedStatus)!])
                : [normalizedStatus]

            const whereOportunidade: Record<string, unknown> = {
                userId,
                status: { in: statusFilter },
            }

            const [oportunidades, count] = await prisma.$transaction([
                prisma.oportunidade.findMany({
                    where: whereOportunidade,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        cliente: {
                            select: {
                                nome: true,
                                email: true,
                                telefone: true,
                                empresa: true,
                            },
                        },
                    },
                }),
                prisma.oportunidade.count({ where: whereOportunidade }),
            ])

            data = oportunidades.map((o) => ({
                ...o,
                status: mapOpportunityStatusForResponse(o.status),
                type: 'oportunidade',
            }))
            total = count
        }

        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.max(1, Math.ceil(total / limit)),
            },
        })
    } catch (error) {
      console.error('Erro ao buscar grupos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar grupos' },
        { status: 500 }
      )
    }
  })
}


