export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

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
            include: {
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

        return NextResponse.json(tarefasProximas)
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
