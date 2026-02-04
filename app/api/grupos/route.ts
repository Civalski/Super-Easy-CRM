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

        const where = {
            userId,
            status,
        }

        const [oportunidades, total] = await prisma.$transaction([
            prisma.oportunidade.findMany({
                where,
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
                            empresa: true, // Useful to see company
                        },
                    },
                    ambiente: {
                        select: {
                            nome: true,
                        },
                    },
                },
            }),
            prisma.oportunidade.count({ where }),
        ])

        return NextResponse.json({
            data: oportunidades,
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
