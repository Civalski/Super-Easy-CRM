import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

const ALLOWED_STAGE = new Set(['sem_contato', 'em_potencial', 'orcamento', 'fechada', 'perdida'])
const ALLOWED_CHANNEL = new Set(['whatsapp', 'email', 'ligacao', 'reuniao'])

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const templates = await prisma.followUpTemplate.findMany({
      where: { userId },
      orderBy: [{ ativo: 'desc' }, { updatedAt: 'desc' }],
    })

      return NextResponse.json(templates)
    } catch (error) {
      console.error('Erro ao listar templates de follow-up:', error)
      return NextResponse.json(
        { error: 'Erro ao listar templates de follow-up' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const etapa = typeof payload.etapa === 'string' ? payload.etapa.trim().toLowerCase() : ''
    const canal = typeof payload.canal === 'string' ? payload.canal.trim().toLowerCase() : ''
    const titulo = typeof payload.titulo === 'string' ? payload.titulo.trim() : null
    const mensagem = typeof payload.mensagem === 'string' ? payload.mensagem.trim() : ''

    if (!ALLOWED_STAGE.has(etapa)) {
      return NextResponse.json({ error: 'Etapa invalida' }, { status: 400 })
    }
    if (!ALLOWED_CHANNEL.has(canal)) {
      return NextResponse.json({ error: 'Canal invalido' }, { status: 400 })
    }
    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem obrigatoria' }, { status: 400 })
    }

    const created = await prisma.followUpTemplate.create({
      data: {
        userId,
        etapa,
        canal,
        titulo,
        mensagem,
        ativo: payload.ativo === false ? false : true,
      },
    })

      return NextResponse.json(created, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar template de follow-up:', error)
      return NextResponse.json(
        { error: 'Erro ao criar template de follow-up' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const id = typeof payload.id === 'string' ? payload.id.trim() : ''
    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })
    }

    const existing = await prisma.followUpTemplate.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template nao encontrado' }, { status: 404 })
    }

    const etapa =
      typeof payload.etapa === 'string' ? payload.etapa.trim().toLowerCase() : undefined
    const canal =
      typeof payload.canal === 'string' ? payload.canal.trim().toLowerCase() : undefined

    if (etapa !== undefined && !ALLOWED_STAGE.has(etapa)) {
      return NextResponse.json({ error: 'Etapa invalida' }, { status: 400 })
    }
    if (canal !== undefined && !ALLOWED_CHANNEL.has(canal)) {
      return NextResponse.json({ error: 'Canal invalido' }, { status: 400 })
    }

    const updated = await prisma.followUpTemplate.update({
      where: { id },
      data: {
        etapa,
        canal,
        titulo:
          payload.titulo !== undefined
            ? typeof payload.titulo === 'string'
              ? payload.titulo.trim()
              : null
            : undefined,
        mensagem:
          payload.mensagem !== undefined
            ? typeof payload.mensagem === 'string'
              ? payload.mensagem.trim()
              : undefined
            : undefined,
        ativo: payload.ativo !== undefined ? payload.ativo === true : undefined,
      },
    })

      return NextResponse.json(updated)
    } catch (error) {
      console.error('Erro ao atualizar template de follow-up:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar template de follow-up' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')?.trim()
      if (!id) {
        return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })
      }

      const deleted = await prisma.followUpTemplate.deleteMany({
      where: { id, userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Template nao encontrado' }, { status: 404 })
    }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir template de follow-up:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir template de follow-up' },
        { status: 500 }
      )
    }
  })
}
