import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

function parseDays(value: unknown) {
  if (value === undefined) return 30
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
      ultimoContato: { lt: cutoff },
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

    const deleted = await prisma.prospecto.deleteMany({ where })

    console.info(
      '[maintenance]',
      JSON.stringify({
        event: 'prospecto.cleanup_stale_contacts',
        userId,
        days,
        cutoff: cutoff.toISOString(),
        deleted: deleted.count,
      })
    )

    return NextResponse.json({
      success: true,
      dryRun: false,
      days,
      cutoff: cutoff.toISOString(),
      deleted: deleted.count,
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
