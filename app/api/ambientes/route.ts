import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let ambientes = await prisma.ambiente.findMany({
      orderBy: {
        nome: 'asc',
      },
    })

    // Se não houver ambientes, cria um ambiente padrão
    if (ambientes.length === 0) {
      const ambientePadrao = await prisma.ambiente.create({
        data: {
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

export async function POST(request: Request) {
  try {
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

