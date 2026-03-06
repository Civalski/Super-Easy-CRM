import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { TAREFA_STATUS_SET, TAREFA_PRIORIDADE_SET } from '@/lib/validations/tarefas'

export const dynamic = 'force-dynamic'

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const tarefa = await prisma.tarefa.findFirst({
        where: { id, userId },
      })

      if (!tarefa) {
        return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 })
      }

      return NextResponse.json(tarefa)
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefa' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const rawBody = await request.json().catch(() => null)
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const body = rawBody as Record<string, unknown>
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

    const updateData: {
      titulo?: string
      descricao?: string | null
      status?: string
      prioridade?: string
      dataVencimento?: Date | null
      clienteId?: string | null
      oportunidadeId?: string | null
      notificar?: boolean
    } = {}

    if (titulo !== undefined) {
      if (typeof titulo !== 'string' || titulo.trim() === '') {
        return NextResponse.json(
          { error: 'Titulo nao pode ser vazio' },
          { status: 400 }
        )
      }
      updateData.titulo = titulo.trim()
    }

    if (descricao !== undefined) {
      if (descricao !== null && typeof descricao !== 'string') {
        return NextResponse.json({ error: 'Descricao invalida' }, { status: 400 })
      }
      updateData.descricao =
        typeof descricao === 'string' && descricao.trim() !== ''
          ? descricao.trim()
          : null
    }

    if (status !== undefined) {
      if (typeof status !== 'string') {
        return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
      }
      const normalizedStatus = status.trim().toLowerCase()
      if (!TAREFA_STATUS_SET.has(normalizedStatus as 'pendente' | 'em_andamento' | 'concluida')) {
        return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
      }
      updateData.status = normalizedStatus
    }

    if (prioridade !== undefined) {
      if (typeof prioridade !== 'string') {
        return NextResponse.json({ error: 'Prioridade invalida' }, { status: 400 })
      }
      const normalizedPrioridade = prioridade.trim().toLowerCase()
      if (!TAREFA_PRIORIDADE_SET.has(normalizedPrioridade as 'baixa' | 'media' | 'alta')) {
        return NextResponse.json({ error: 'Prioridade invalida' }, { status: 400 })
      }
      updateData.prioridade = normalizedPrioridade
    }

    if (dataVencimento !== undefined) {
      const parsedDate = parseOptionalDate(dataVencimento)
      if (dataVencimento && !parsedDate) {
        return NextResponse.json(
          { error: 'Data de vencimento invalida' },
          { status: 400 }
        )
      }
      updateData.dataVencimento = parsedDate ?? null
    }

    if (notificar !== undefined) {
      if (typeof notificar !== 'boolean') {
        return NextResponse.json(
          { error: 'Notificar deve ser booleano' },
          { status: 400 }
        )
      }
      updateData.notificar = notificar
    }

    if (clienteId !== undefined) {
      if (clienteId === null || clienteId === '') {
        updateData.clienteId = null
      } else if (typeof clienteId === 'string') {
        const trimmedClienteId = clienteId.trim()
        if (!trimmedClienteId) {
          updateData.clienteId = null
        } else {
          const cliente = await prisma.cliente.findFirst({
            where: { id: trimmedClienteId, userId },
            select: { id: true },
          })
          if (!cliente) {
            return NextResponse.json(
              { error: 'Cliente nao encontrado' },
              { status: 404 }
            )
          }
          updateData.clienteId = trimmedClienteId
        }
      } else {
        return NextResponse.json({ error: 'Cliente invalido' }, { status: 400 })
      }
    }

    if (oportunidadeId !== undefined) {
      if (oportunidadeId === null || oportunidadeId === '') {
        updateData.oportunidadeId = null
      } else if (typeof oportunidadeId === 'string') {
        const trimmedOportunidadeId = oportunidadeId.trim()
        if (!trimmedOportunidadeId) {
          updateData.oportunidadeId = null
        } else {
          const oportunidade = await prisma.oportunidade.findFirst({
            where: { id: trimmedOportunidadeId, userId },
            select: { id: true },
          })
          if (!oportunidade) {
            return NextResponse.json(
              { error: 'Orçamento não encontrado' },
              { status: 404 }
            )
          }
          updateData.oportunidadeId = trimmedOportunidadeId
        }
      } else {
        return NextResponse.json(
          { error: 'Oportunidade invalida' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo valido para atualizacao' },
        { status: 400 }
      )
    }

    const updated = await prisma.tarefa.updateMany({
      where: { id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 })
    }

    const tarefaAtualizada = await prisma.tarefa.findFirst({
      where: { id, userId },
    })

    return NextResponse.json(tarefaAtualizada)
  } catch (error: unknown) {
    console.error('Erro ao atualizar tarefa:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 })
    }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou orçamento não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    )
  }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const result = await prisma.tarefa.deleteMany({
        where: { id, userId },
      })

      if (result.count === 0) {
        return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error: unknown) {
      console.error('Erro ao deletar tarefa:', error)
      const prismaError = error as { code?: string }
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Erro ao deletar tarefa' },
        { status: 500 }
      )
    }
  })
}

