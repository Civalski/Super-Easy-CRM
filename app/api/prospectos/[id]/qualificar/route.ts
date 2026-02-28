import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { logBusinessEvent } from '@/lib/observability/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const exists = await prisma.prospecto.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    })

    if (!exists) {
      return NextResponse.json({ error: 'Prospecto nao encontrado' }, { status: 404 })
    }

    const updated = await prisma.prospecto.updateMany({
      where: { id, userId },
      data: { status: 'qualificado' },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Prospecto nao encontrado' }, { status: 404 })
    }

    const prospecto = await prisma.prospecto.findFirst({
      where: { id, userId },
    })

    if (prospecto) {
      logBusinessEvent({
        event: 'prospecto.qualificado',
        userId,
        entity: 'prospecto',
        entityId: id,
        from: exists.status,
        to: 'qualificado',
      })
    }

    return NextResponse.json({
      success: true,
      prospecto,
      mensagem: 'Prospecto marcado como em potencial com sucesso',
    })
  } catch (error) {
    console.error('Erro ao qualificar prospecto:', error)
    return NextResponse.json(
      { error: 'Erro ao qualificar prospecto' },
      { status: 500 }
    )
  }
}
