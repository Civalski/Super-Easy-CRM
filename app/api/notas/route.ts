import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'

export const dynamic = 'force-dynamic'

const TIPOS = new Set(['bloco', 'email', 'whatsapp'])

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const tipo = searchParams.get('tipo')?.trim().toLowerCase()

      const where = { userId } as { userId: string; tipo?: string }
      if (tipo && TIPOS.has(tipo)) {
        where.tipo = tipo
      }

      const notas = await prisma.nota.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      })

      return NextResponse.json(notas)
    } catch (error) {
      console.error('Erro ao listar notas:', error)
      return NextResponse.json(
        { error: 'Erro ao listar notas' },
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
      const tipo = typeof payload.tipo === 'string' ? payload.tipo.trim().toLowerCase() : 'bloco'
      const titulo = typeof payload.titulo === 'string' ? payload.titulo.trim() : null
      const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : null
      const conteudo = typeof payload.conteudo === 'string' ? payload.conteudo.trim() : ''

      if (!TIPOS.has(tipo)) {
        return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
      }

      const created = await prisma.nota.create({
        data: {
          userId,
          tipo,
          titulo,
          descricao,
          conteudo,
        },
      })

      return NextResponse.json(created, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar nota:', error)
      return NextResponse.json(
        { error: 'Erro ao criar nota' },
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

      const existing = await prisma.nota.findFirst({
        where: { id, userId },
        select: { id: true },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Nota nao encontrada' }, { status: 404 })
      }

      const tipo = typeof payload.tipo === 'string' ? payload.tipo.trim().toLowerCase() : undefined
      if (tipo !== undefined && !TIPOS.has(tipo)) {
        return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
      }

      const updated = await prisma.nota.update({
        where: { id },
        data: {
          tipo,
          titulo:
            payload.titulo !== undefined
              ? typeof payload.titulo === 'string'
                ? payload.titulo.trim()
                : null
              : undefined,
          descricao:
            payload.descricao !== undefined
              ? typeof payload.descricao === 'string'
                ? payload.descricao.trim()
                : null
              : undefined,
          conteudo:
            payload.conteudo !== undefined
              ? typeof payload.conteudo === 'string'
                ? payload.conteudo.trim()
                : undefined
              : undefined,
        },
      })

      return NextResponse.json(updated)
    } catch (error) {
      console.error('Erro ao atualizar nota:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar nota' },
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

      const deleted = await prisma.nota.deleteMany({
        where: { id, userId },
      })

      if (deleted.count === 0) {
        return NextResponse.json({ error: 'Nota nao encontrada' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir nota:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir nota' },
        { status: 500 }
      )
    }
  })
}
