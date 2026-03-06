import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/grupos/stats
 * Retorna estatísticas do funil (ex.: contatos iniciados hoje).
 * "Hoje" = dia atual em UTC.
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (userId) => {
        try {
            await ensureDatabaseInitialized()

            const now = new Date()
            const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
            const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))

            const contatosIniciadosHoje = await prisma.prospecto.count({
                where: {
                    userId,
                    ultimoContato: {
                        gte: startOfToday,
                        lt: endOfToday,
                    },
                },
            })

            return NextResponse.json({
                contatosIniciadosHoje,
            })
        } catch (error) {
            console.error('Erro ao buscar stats do funil:', error)
            return NextResponse.json(
                { error: 'Erro ao buscar estatísticas' },
                { status: 500 }
            )
        }
    })
}
