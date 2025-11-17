import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ambiente = await prisma.ambiente.findUnique({
      where: { id: params.id },
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const ambienteAtualizado = await prisma.ambiente.update({
      where: { id: params.id },
      data: updateData,
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ambiente.delete({
      where: { id: params.id },
    })

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

