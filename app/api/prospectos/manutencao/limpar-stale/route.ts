import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { descartarContatadosStale } from '@/lib/prospectos/descartarContatadosStale'

export const dynamic = 'force-dynamic'

const DEFAULT_DAYS = 8 // Aviso aos 7 dias; descarte automático aos 8

function parseDays(value: unknown) {
  if (value === undefined) return DEFAULT_DAYS
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) return null
  return parsed
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => ({}))
    const days = parseDays((body as Record<string, unknown>).days)
    const dryRun = (body as Record<string, unknown>).dryRun === true

    if (days === null) {
      return NextResponse.json(
        { error: 'Parametro days invalido (use inteiro entre 1 e 365)' },
        { status: 400 }
      )
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const where = {
      userId,
      status: 'em_contato',
      OR: [
        { ultimoContato: { lt: cutoff } },
        { ultimoContato: null, updatedAt: { lt: cutoff } },
      ],
    } as const

    const affected = await prisma.prospecto.count({ where })

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        days,
        cutoff: cutoff.toISOString(),
        affected,
      })
    }

    const descartados = await descartarContatadosStale(userId, days)

    console.info(
      '[maintenance]',
      JSON.stringify({
        event: 'prospecto.descartar_contatados_stale',
        userId,
        days,
        cutoff: cutoff.toISOString(),
        descartados,
      })
    )

    return NextResponse.json({
      success: true,
      dryRun: false,
      days,
      cutoff: cutoff.toISOString(),
      descartados,
    })
    } catch (error) {
      console.error('Erro ao limpar prospectos stale:', error)
      return NextResponse.json(
        { error: 'Erro ao limpar prospectos stale' },
        { status: 500 }
      )
    }
  })
}
