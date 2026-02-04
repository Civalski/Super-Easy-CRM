import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let ambientes = await prisma.ambiente.findMany({
      where: { userId },
      orderBy: {
        nome: 'asc',
      },
    })

    // Se não houver ambientes, cria um ambiente padrão
    if (ambientes.length === 0) {
      const ambientePadrao = await prisma.ambiente.create({
        data: {
          userId,
          nome: 'Ambiente Padrão',
          descricao: 'Ambiente criado automaticamente',
        },
      })
      ambientes = [ambientePadrao]
    }

    return NextResponse.json(ambientes)
  } catch (error) {
    console.error('Erro ao buscar ambientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ambientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, descricao } = body

    // Validação básica
    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const novoAmbiente = await prisma.ambiente.create({
      data: {
        userId,
        nome: nome.trim(),
        descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
      },
    })

    return NextResponse.json(novoAmbiente, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar ambiente' },
      { status: 500 }
    )
  }
}
