import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { logBusinessEvent } from '@/lib/observability/audit'
import { roundMoney } from '@/lib/money'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS_ENTREGA = new Set([
  'pendente',
  'em_preparacao',
  'enviado',
  'entregue',
])

const pedidoInclude = {
  oportunidade: {
    select: {
      id: true,
      titulo: true,
      descricao: true,
      valor: true,
      clienteId: true,
      status: true,
      statusAnterior: true,
      probabilidade: true,
      dataFechamento: true,
      createdAt: true,
      cliente: {
        select: {
          nome: true,
        },
      },
    },
  },
} as const

function normalizeStatusEntrega(status?: string | null) {
  if (!status) return undefined
  const normalizedInput = status.trim().toLowerCase()
  const normalizedStatus =
    normalizedInput === 'em preparacao'
      ? 'em_preparacao'
      : normalizedInput

  return ALLOWED_STATUS_ENTREGA.has(normalizedStatus) ? normalizedStatus : undefined
}

function parseOptionalString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: {
      statusEntrega?: string
      pagamentoConfirmado?: boolean
      formaPagamento?: string | null
      dataEntrega?: Date | null
      observacoes?: string | null
    } = {}

    if (body.statusEntrega !== undefined) {
      const normalizedStatus = normalizeStatusEntrega(
        typeof body.statusEntrega === 'string' ? body.statusEntrega : undefined
      )
      if (!normalizedStatus) {
        return NextResponse.json(
          { error: 'Status de entrega invalido' },
          { status: 400 }
        )
      }
      updateData.statusEntrega = normalizedStatus
    }

    if (body.formaPagamento !== undefined) {
      updateData.formaPagamento = parseOptionalString(body.formaPagamento) ?? null
    }

    if (body.pagamentoConfirmado !== undefined) {
      if (typeof body.pagamentoConfirmado !== 'boolean') {
        return NextResponse.json(
          { error: 'Pagamento confirmado deve ser booleano' },
          { status: 400 }
        )
      }
      updateData.pagamentoConfirmado = body.pagamentoConfirmado
    }

    if (body.observacoes !== undefined) {
      updateData.observacoes = parseOptionalString(body.observacoes) ?? null
    }

    if (body.dataEntrega !== undefined) {
      const parsedDate = parseOptionalDate(body.dataEntrega)
      if (body.dataEntrega && !parsedDate) {
        return NextResponse.json(
          { error: 'Data de entrega invalida' },
          { status: 400 }
        )
      }
      updateData.dataEntrega = parsedDate ?? null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo valido para atualizacao' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const pedidoAtual = await tx.pedido.findFirst({
        where: { id: params.id, userId },
        include: pedidoInclude,
      })

      if (!pedidoAtual) {
        return { notFound: true as const }
      }

      const pedidoAtualizado = await tx.pedido.update({
        where: { id: pedidoAtual.id },
        data: updateData,
        include: pedidoInclude,
      })

      const vendaConfirmada =
        pedidoAtualizado.statusEntrega === 'entregue' &&
        pedidoAtualizado.pagamentoConfirmado === true

      const oportunidadeAtual = pedidoAtualizado.oportunidade
      const oportunidadeEstaFechada = oportunidadeAtual.status === 'fechada'

      if (vendaConfirmada && !oportunidadeEstaFechada) {
        await tx.oportunidade.updateMany({
          where: {
            id: oportunidadeAtual.id,
            userId,
          },
          data: {
            statusAnterior:
              oportunidadeAtual.status === 'perdida' || oportunidadeAtual.status === 'fechada'
                ? oportunidadeAtual.statusAnterior
                : oportunidadeAtual.status,
            status: 'fechada',
            dataFechamento: new Date(),
          },
        })

        const prospectoVinculado = await tx.prospecto.findFirst({
          where: {
            userId,
            clienteId: oportunidadeAtual.clienteId,
            status: { not: 'convertido' },
          },
          select: { id: true },
        })

        if (prospectoVinculado) {
          await tx.prospecto.update({
            where: { id: prospectoVinculado.id },
            data: { status: 'convertido' },
          })
        }

        const valorConta =
          pedidoAtualizado.totalLiquido > 0
            ? pedidoAtualizado.totalLiquido
            : oportunidadeAtual.valor || 0
        const valorContaNormalizado = roundMoney(valorConta)

        const contaExistente = await tx.contaReceber.findUnique({
          where: { pedidoId: pedidoAtualizado.id },
          select: { id: true },
        })

        if (!contaExistente) {
          const conta = await tx.contaReceber.create({
            data: {
              userId,
              pedidoId: pedidoAtualizado.id,
              oportunidadeId: oportunidadeAtual.id,
              descricao: `Recebimento do pedido #${pedidoAtualizado.numero}`,
              valorTotal: valorContaNormalizado,
              valorRecebido: valorContaNormalizado,
              status: 'pago',
              dataVencimento: pedidoAtualizado.dataEntrega || new Date(),
            },
          })

          if (valorContaNormalizado > 0) {
            await tx.movimentoFinanceiro.create({
              data: {
                userId,
                contaReceberId: conta.id,
                tipo: 'entrada',
                valor: valorContaNormalizado,
                observacoes: 'Recebimento automatico ao confirmar venda no pedido',
              },
            })
          }
        } else {
          await tx.contaReceber.update({
            where: { id: contaExistente.id },
            data: {
              valorTotal: valorContaNormalizado,
              valorRecebido: valorContaNormalizado,
              status: 'pago',
              dataVencimento: pedidoAtualizado.dataEntrega || new Date(),
            },
          })
        }

        logBusinessEvent({
          event: 'pedido.venda_confirmada',
          userId,
          entity: 'pedido',
          entityId: params.id,
          from: oportunidadeAtual.status,
          to: 'fechada',
          metadata: {
            oportunidadeId: oportunidadeAtual.id,
          },
        })
      }

      if (!vendaConfirmada && oportunidadeEstaFechada) {
        await tx.oportunidade.updateMany({
          where: {
            id: oportunidadeAtual.id,
            userId,
          },
          data: {
            status: oportunidadeAtual.statusAnterior || 'orcamento',
            statusAnterior: null,
            dataFechamento: null,
          },
        })

        const conta = await tx.contaReceber.findUnique({
          where: { pedidoId: pedidoAtualizado.id },
          select: { id: true, valorRecebido: true, status: true },
        })

        if (conta && conta.status !== 'cancelado') {
          await tx.contaReceber.update({
            where: { id: conta.id },
            data: {
              status: 'cancelado',
            },
          })

          if (conta.valorRecebido > 0) {
            await tx.movimentoFinanceiro.create({
              data: {
                userId,
                contaReceberId: conta.id,
                tipo: 'estorno',
                valor: conta.valorRecebido,
                observacoes: 'Estorno automatico ao reabrir venda do pedido',
              },
            })
          }
        }

        logBusinessEvent({
          event: 'pedido.venda_reaberta',
          userId,
          entity: 'pedido',
          entityId: params.id,
          from: 'fechada',
          to: oportunidadeAtual.statusAnterior || 'orcamento',
          metadata: {
            oportunidadeId: oportunidadeAtual.id,
          },
        })
      }

      const pedidoFinal = await tx.pedido.findFirst({
        where: { id: params.id, userId },
        include: pedidoInclude,
      })

      if (!pedidoFinal) {
        return { notFound: true as const }
      }

      return {
        notFound: false as const,
        pedido: pedidoFinal,
        vendaConfirmada,
      }
    })

    if (result.notFound) {
      return NextResponse.json(
        { error: 'Pedido nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...result.pedido,
      vendaConfirmada: result.vendaConfirmada,
    })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pedido nao encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.pedido.deleteMany({
      where: { id: params.id, userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Pedido nao encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar pedido' },
      { status: 500 }
    )
  }
}
