import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: params.id },
    })

    if (!tarefa) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tarefa' },
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
    const {
      titulo,
      descricao,
      status,
      prioridade,
      dataVencimento,
      clienteId,
      oportunidadeId,
    } = body

    const updateData: any = {}

    if (titulo !== undefined) {
      if (!titulo || titulo.trim() === '') {
        return NextResponse.json(
          { error: 'Título não pode ser vazio' },
          { status: 400 }
        )
      }
      updateData.titulo = titulo.trim()
    }

    if (descricao !== undefined) {
      updateData.descricao = descricao && descricao.trim() !== '' ? descricao.trim() : null
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (prioridade !== undefined) {
      updateData.prioridade = prioridade
    }

    if (dataVencimento !== undefined) {
      updateData.dataVencimento = dataVencimento ? new Date(dataVencimento) : null
    }

    if (clienteId !== undefined) {
      if (clienteId && clienteId.trim() !== '') {
        const cliente = await prisma.cliente.findUnique({
          where: { id: clienteId },
        })
        if (!cliente) {
          return NextResponse.json(
            { error: 'Cliente não encontrado' },
            { status: 404 }
          )
        }
        updateData.clienteId = clienteId
      } else {
        updateData.clienteId = null
      }
    }

    if (oportunidadeId !== undefined) {
      if (oportunidadeId && oportunidadeId.trim() !== '') {
        const oportunidade = await prisma.oportunidade.findUnique({
          where: { id: oportunidadeId },
        })
        if (!oportunidade) {
          return NextResponse.json(
            { error: 'Oportunidade não encontrada' },
            { status: 404 }
          )
        }
        updateData.oportunidadeId = oportunidadeId
      } else {
        updateData.oportunidadeId = null
      }
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(tarefaAtualizada)
  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou oportunidade não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tarefa.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar tarefa:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar tarefa' },
      { status: 500 }
    )
  }
}

