import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tarefa = await prisma.tarefa.findFirst({
      where: { id: params.id, userId },
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      titulo,
      descricao,
      status,
      prioridade,
      dataVencimento,
      clienteId,
      oportunidadeId,
      notificar,
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

    if (notificar !== undefined) {
      updateData.notificar = typeof notificar === 'boolean' ? notificar : false
    }

    if (clienteId !== undefined) {
      if (clienteId && clienteId.trim() !== '') {
        const cliente = await prisma.cliente.findFirst({
          where: { id: clienteId, userId },
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
        const oportunidade = await prisma.oportunidade.findFirst({
          where: { id: oportunidadeId, userId },
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

    const updated = await prisma.tarefa.updateMany({
      where: { id: params.id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    const tarefaAtualizada = await prisma.tarefa.findFirst({
      where: { id: params.id, userId },
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.tarefa.deleteMany({
      where: { id: params.id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

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
