import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

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

        // Lazy Cleanup: Delete prospects older than 30 days that are stil "cold" (never contacted)
        // Only remove leads with status='novo' that have NO ultimoContato (never sent to funnel)
        // Leads with ultimoContato set were intentionally sent to the funnel and must NOT be deleted
        const date30DaysAgo = new Date()
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30)

        await prisma.prospecto.deleteMany({
            where: {
                userId,
                status: 'novo',
                ultimoContato: null,       // Só remove leads frios nunca enviados ao funil
                createdAt: { lt: date30DaysAgo }
            }
        }).catch(err => console.error('Error cleaning up prospects:', err))

        let data = []
        let total = 0

        // Mapping of frontend listing status to logic
        // prospeccao -> Prospecto (novo, em_contato)
        // qualificacao -> Prospecto (qualificado)
        // others -> Oportunidade (status matches)

        if (status === 'prospeccao' || status === 'contatado' || status === 'qualificacao') {
            const prospectoStatus = status === 'prospeccao'
                ? 'novo'
                : status === 'contatado'
                    ? 'em_contato'
                    : 'qualificado'

            const whereProspecto: any = {
                userId,
                status: prospectoStatus,
                // Para "prospeccao" (status=novo): excluir leads frios que ainda não foram
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

            data = prospectos.map(p => ({
                id: p.id,
                titulo: p.nomeFantasia || p.razaoSocial,
                valor: null,
                status: status,
                subStatus: p.status, // Pass the original prospect status (novo/em_contato)
                createdAt: p.createdAt.toISOString(),
                type: 'prospecto', // Flag to identify origin
                cliente: {
                    nome: p.nomeFantasia || p.razaoSocial,
                    email: p.email,
                    telefone: p.telefone1,
                    empresa: p.razaoSocial,
                },
            }))
            total = count

        } else {
            const whereOportunidade = {
                userId,
                status,
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

            data = oportunidades.map(o => ({
                ...o,
                type: 'oportunidade'
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
