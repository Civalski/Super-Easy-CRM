export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

function parseLimit(value: string | null, fallback = 50) {
    if (!value) return fallback
    const parsed = Number(value)
    if (!Number.isInteger(parsed)) return fallback
    return Math.min(200, Math.max(1, parsed))
}

export async function GET(request: NextRequest) {
    try {
        await ensureDatabaseInitialized()

        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Calcular data limite (próximos 2 dias)
        const dataLimite = new Date()
        dataLimite.setDate(dataLimite.getDate() + 2)

        const { searchParams } = new URL(request.url)
        const limit = parseLimit(searchParams.get('limit'))

        const tarefasProximas = await prisma.tarefa.findMany({
            where: {
                userId,
                status: {
                    not: 'concluida'
                },
                notificacaoExcluida: false,
                dataVencimento: {
                    lte: dataLimite, // Menor ou igual a data limite (inclui passado/atrasadas)
                    not: null
                }
            },
            orderBy: {
                dataVencimento: 'asc',
            },
            take: limit,
            select: {
                id: true,
                titulo: true,
                descricao: true,
                prioridade: true,
                status: true,
                dataVencimento: true,
                notificar: true,
                cliente: {
                    select: {
                        nome: true
                    }
                },
                oportunidade: {
                    select: {
                        titulo: true
                    }
                }
            }
        })

        return NextResponse.json(tarefasProximas, {
            headers: {
                'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
            },
        })
    } catch (error) {
        console.error('Erro ao buscar notificações:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar notificações' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, type } = body

        if (type === 'all') {
            // Dismiss all matching criteria
            const dataLimite = new Date()
            dataLimite.setDate(dataLimite.getDate() + 2)

            await prisma.tarefa.updateMany({
                where: {
                    userId,
                    status: { not: 'concluida' },
                    notificacaoExcluida: false,
                    dataVencimento: {
                        lte: dataLimite,
                        not: null
                    }
                },
                data: {
                    notificacaoExcluida: true
                }
            })
        } else if (id) {
            // Dismiss one
            await prisma.tarefa.updateMany({
                where: {
                    id,
                    userId
                },
                data: {
                    notificacaoExcluida: true
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir notificação:', error)
        return NextResponse.json(
            { error: 'Erro ao excluir notificação' },
            { status: 500 }
        )
    }
}
