import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Helper to get Brazil date string YYYY-MM-DD
 */
function getBrazilDateString(date: Date): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Get start and end of a specific day in Brazil timezone
 */
function getDayRange(dateStr: string): { start: Date; end: Date } {
    // dateStr is YYYY-MM-DD
    const start = new Date(`${dateStr}T00:00:00-03:00`)
    const end = new Date(`${dateStr}T23:59:59.999-03:00`)
    return { start, end }
}

/**
 * Count contacts made on a specific day
 * A contact = a prospecto that was updated to status 'em_contato' on that day
 */
async function countContactsOnDay(userId: string, dateStr: string): Promise<number> {
    const { start, end } = getDayRange(dateStr)

    const count = await prisma.prospecto.count({
        where: {
            userId,
            status: 'em_contato',
            updatedAt: {
                gte: start,
                lte: end,
            },
        },
    })

    return count
}

/**
 * GET /api/metas/contatos-diarios
 * Returns today's goal progress and accumulated debt
 */
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get or create config
        let config = await prisma.metaContatoConfig.findUnique({
            where: { userId },
            include: { diasEsquecidos: true },
        })

        if (!config) {
            config = await prisma.metaContatoConfig.create({
                data: { userId, metaDiaria: 25, ativo: true },
                include: { diasEsquecidos: true },
            })
        }

        if (!config.ativo) {
            return NextResponse.json({
                ativo: false,
                metaDiaria: config.metaDiaria,
                contatosHoje: 0,
                debito: [],
                debitoTotal: 0,
            })
        }

        const now = new Date()
        const todayStr = getBrazilDateString(now)

        // Count today's contacts
        const contatosHoje = await countContactsOnDay(userId, todayStr)

        // Check the last 3 days for debt (excluding today)
        const dismissedDates = new Set(config.diasEsquecidos.map(d => d.data))
        const debito: { data: string; meta: number; feitos: number; faltam: number }[] = []

        for (let i = 1; i <= 3; i++) {
            const pastDate = new Date(now)
            pastDate.setDate(pastDate.getDate() - i)
            const pastDateStr = getBrazilDateString(pastDate)

            // Skip if this day was dismissed
            if (dismissedDates.has(pastDateStr)) continue

            const feitos = await countContactsOnDay(userId, pastDateStr)
            const faltam = Math.max(0, config.metaDiaria - feitos)

            if (faltam > 0) {
                debito.push({
                    data: pastDateStr,
                    meta: config.metaDiaria,
                    feitos,
                    faltam,
                })
            }
        }

        const debitoTotal = debito.reduce((sum, d) => sum + d.faltam, 0)

        return NextResponse.json({
            ativo: true,
            metaDiaria: config.metaDiaria,
            contatosHoje,
            progressoHoje: Math.min(100, Math.round((contatosHoje / config.metaDiaria) * 100)),
            debito,
            debitoTotal,
            hoje: todayStr,
        })
    } catch (error) {
        console.error('Erro ao buscar meta de contatos:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar meta de contatos' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/metas/contatos-diarios
 * Actions: 'esquecer' (dismiss a specific day), 'esquecer_todos' (dismiss all)
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request)
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, data } = body

        let config = await prisma.metaContatoConfig.findUnique({
            where: { userId },
        })

        if (!config) {
            config = await prisma.metaContatoConfig.create({
                data: { userId, metaDiaria: 25, ativo: true },
            })
        }

        if (action === 'esquecer' && data) {
            // Dismiss a specific day's debt
            await prisma.metaContatoDiaEsquecido.upsert({
                where: {
                    configId_data: {
                        configId: config.id,
                        data: data,
                    },
                },
                create: {
                    configId: config.id,
                    data: data,
                },
                update: {},
            })

            return NextResponse.json({ success: true, dismissed: data })
        }

        if (action === 'esquecer_todos') {
            // Dismiss all debt days (last 3 days)
            const now = new Date()
            const dates: string[] = []
            for (let i = 1; i <= 3; i++) {
                const pastDate = new Date(now)
                pastDate.setDate(pastDate.getDate() - i)
                dates.push(getBrazilDateString(pastDate))
            }

            await Promise.all(
                dates.map(d =>
                    prisma.metaContatoDiaEsquecido.upsert({
                        where: {
                            configId_data: {
                                configId: config!.id,
                                data: d,
                            },
                        },
                        create: {
                            configId: config!.id,
                            data: d,
                        },
                        update: {},
                    })
                )
            )

            return NextResponse.json({ success: true, dismissed: dates })
        }

        if (action === 'atualizar_meta') {
            const metaDiaria = Number(body.metaDiaria)
            if (!Number.isFinite(metaDiaria) || metaDiaria < 1 || !Number.isInteger(metaDiaria)) {
                return NextResponse.json(
                    { error: 'Meta deve ser um número inteiro maior que zero' },
                    { status: 400 }
                )
            }

            await prisma.metaContatoConfig.update({
                where: { id: config.id },
                data: { metaDiaria },
            })

            return NextResponse.json({ success: true, metaDiaria })
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (error) {
        console.error('Erro ao processar meta de contatos:', error)
        return NextResponse.json(
            { error: 'Erro ao processar meta de contatos' },
            { status: 500 }
        )
    }
}
