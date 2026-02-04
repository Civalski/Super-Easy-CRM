import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ambiente = await prisma.ambiente.findFirst({
      where: { id: params.id, userId },
    })
    
    if (!ambiente) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(ambiente)
  } catch (error) {
    console.error('Erro ao buscar ambiente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ambiente' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, descricao } = body

    const updateData: { nome?: string; descricao?: string | null } = {}
    
    if (nome !== undefined) {
      if (!nome || nome.trim() === '') {
        return NextResponse.json(
          { error: 'Nome não pode ser vazio' },
          { status: 400 }
        )
      }
      updateData.nome = nome.trim()
    }

    if (descricao !== undefined) {
      updateData.descricao = descricao && descricao.trim() !== '' ? descricao.trim() : null
    }

    const updated = await prisma.ambiente.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    const ambienteAtualizado = await prisma.ambiente.findFirst({
      where: { id: params.id, userId },
    })

    return NextResponse.json(ambienteAtualizado)
  } catch (error: any) {
    console.error('Erro ao atualizar ambiente:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar ambiente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.ambiente.deleteMany({
      where: { id: params.id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Ambiente deletado com sucesso' })
  } catch (error: any) {
    console.error('Erro ao deletar ambiente:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ambiente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar ambiente' },
      { status: 500 }
    )
  }
}
