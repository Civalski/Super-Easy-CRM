import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ALLOWED_CHANNEL = new Set(['whatsapp', 'email', 'ligacao', 'reuniao'])

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oportunidade = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    })
    if (!oportunidade) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    const attempts = await prisma.followUpAttempt.findMany({
      where: { userId, oportunidadeId: params.id },
      include: {
        template: {
          select: {
            id: true,
            etapa: true,
            canal: true,
            titulo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Erro ao listar historico de follow-up:', error)
    return NextResponse.json(
      { error: 'Erro ao listar historico de follow-up' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }
    const payload = body as Record<string, unknown>

    const oportunidade = await prisma.oportunidade.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    })
    if (!oportunidade) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    const canal = typeof payload.canal === 'string' ? payload.canal.trim().toLowerCase() : ''
    const mensagem =
      typeof payload.mensagem === 'string' ? payload.mensagem.trim() : ''
    const resultado =
      typeof payload.resultado === 'string' ? payload.resultado.trim() : null
    const templateId =
      typeof payload.templateId === 'string' ? payload.templateId.trim() : null

    if (!ALLOWED_CHANNEL.has(canal)) {
      return NextResponse.json({ error: 'Canal invalido' }, { status: 400 })
    }
    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem obrigatoria' }, { status: 400 })
    }

    if (templateId) {
      const template = await prisma.followUpTemplate.findFirst({
        where: { id: templateId, userId },
        select: { id: true },
      })
      if (!template) {
        return NextResponse.json({ error: 'Template nao encontrado' }, { status: 404 })
      }
    }

    const created = await prisma.followUpAttempt.create({
      data: {
        userId,
        oportunidadeId: params.id,
        templateId,
        canal,
        mensagem,
        resultado,
      },
      include: {
        template: {
          select: {
            id: true,
            etapa: true,
            canal: true,
            titulo: true,
          },
        },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar follow-up:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar follow-up' },
      { status: 500 }
    )
  }
}
