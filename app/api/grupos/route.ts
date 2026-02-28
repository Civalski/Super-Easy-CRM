import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import {
    mapOpportunityStatusForResponse,
    normalizeOpportunityStatus,
    expandOpportunityStatuses,
} from '@/lib/domain/status'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await ensureDatabaseInitialized()

        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
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
        // sem_contato -> Prospecto (novo)
        // contatado -> Prospecto (em_contato)
        // em_potencial -> Prospecto (qualificado)
        // others -> Oportunidade
        if (normalizedStatus === 'sem_contato' || normalizedStatus === 'contatado' || normalizedStatus === 'em_potencial') {
            const prospectoStatus = normalizedStatus === 'sem_contato'
                ? 'novo'
                : normalizedStatus === 'contatado'
                    ? 'em_contato'
                    : 'qualificado'

            const whereProspecto: Record<string, unknown> = {
                userId,
                status: prospectoStatus,
                // Para "sem_contato" (status=novo): excluir leads frios que ainda não foram
                // enviados ao funil (ultimoContato=null). Esses ficam na aba Leads.
                // Leads com ultimoContato definido foram enviados explicitamente ao Funil.
                ...(prospectoStatus === 'novo' ? { NOT: { ultimoContato: null } } : {}),
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
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Erro ao buscar grupos:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar grupos' },
            { status: 500 }
        )
    }
}
