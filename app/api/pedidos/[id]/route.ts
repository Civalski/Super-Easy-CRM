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

const ALLOWED_PAYMENT_METHODS = new Set([
  'pix',
  'dinheiro',
  'cartao',
  'parcelado',
])

const ALLOWED_NEXT_ACTION_CHANNELS = new Set([
  'whatsapp',
  'email',
  'ligacao',
  'reuniao',
  'outro',
])

const pedidoInclude = {
  oportunidade: {
    select: {
      id: true,
      titulo: true,
      descricao: true,
      valor: true,
      clienteId: true,
      formaPagamento: true,
      parcelas: true,
      desconto: true,
      status: true,
      statusAnterior: true,
      probabilidade: true,
      dataFechamento: true,
      proximaAcaoEm: true,
      canalProximaAcao: true,
      responsavelProximaAcao: true,
      lembreteProximaAcao: true,
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

function normalizeFormaPagamento(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const normalizedInput = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalizedInput === '') return null
  if (normalizedInput === 'parcelamento') return 'parcelado'

  return ALLOWED_PAYMENT_METHODS.has(normalizedInput)
    ? normalizedInput
    : undefined
}

function parseOptionalParcelas(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 24) return undefined
  return parsed
}

function parseOptionalNonNegativeNumber(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return roundMoney(parsed)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const pedidoUpdateData: {
      statusEntrega?: string
      pagamentoConfirmado?: boolean
      formaPagamento?: string | null
      dataEntrega?: Date | null
      observacoes?: string | null
    } = {}
    const oportunidadeUpdateData: {
      titulo?: string
      descricao?: string | null
      valor?: number | null
      clienteId?: string
      formaPagamento?: string | null
      parcelas?: number | null
      desconto?: number | null
      probabilidade?: number
      dataFechamento?: Date | null
      proximaAcaoEm?: Date | null
      canalProximaAcao?: string | null
      responsavelProximaAcao?: string | null
      lembreteProximaAcao?: boolean
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
      pedidoUpdateData.statusEntrega = normalizedStatus
    }

    const normalizedFormaPagamento = normalizeFormaPagamento(body.formaPagamento)
    if (body.formaPagamento !== undefined && normalizedFormaPagamento === undefined) {
      return NextResponse.json(
        { error: 'Forma de pagamento invalida' },
        { status: 400 }
      )
    }
    if (body.formaPagamento !== undefined) {
      pedidoUpdateData.formaPagamento = normalizedFormaPagamento ?? null
    }

    if (body.pagamentoConfirmado !== undefined) {
      if (typeof body.pagamentoConfirmado !== 'boolean') {
        return NextResponse.json(
          { error: 'Pagamento confirmado deve ser booleano' },
          { status: 400 }
        )
      }
      pedidoUpdateData.pagamentoConfirmado = body.pagamentoConfirmado
    }

    if (body.observacoes !== undefined) {
      pedidoUpdateData.observacoes = parseOptionalString(body.observacoes) ?? null
    }

    if (body.dataEntrega !== undefined) {
      const parsedDate = parseOptionalDate(body.dataEntrega)
      if (body.dataEntrega && !parsedDate) {
        return NextResponse.json(
          { error: 'Data de entrega invalida' },
          { status: 400 }
        )
      }
      pedidoUpdateData.dataEntrega = parsedDate ?? null
    }

    if (body.titulo !== undefined) {
      if (typeof body.titulo !== 'string' || body.titulo.trim() === '') {
        return NextResponse.json(
          { error: 'Titulo invalido' },
          { status: 400 }
        )
      }
      oportunidadeUpdateData.titulo = body.titulo.trim()
    }

    if (body.descricao !== undefined) {
      if (body.descricao !== null && typeof body.descricao !== 'string') {
        return NextResponse.json(
          { error: 'Descricao invalida' },
          { status: 400 }
        )
      }
      oportunidadeUpdateData.descricao =
        typeof body.descricao === 'string' && body.descricao.trim() !== ''
          ? body.descricao.trim()
          : null
    }

    if (body.valor !== undefined) {
      if (body.valor === null || body.valor === '') {
        oportunidadeUpdateData.valor = null
      } else {
        const parsedValue = Number(body.valor)
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
          return NextResponse.json(
            { error: 'Valor invalido' },
            { status: 400 }
          )
        }
        oportunidadeUpdateData.valor = roundMoney(parsedValue)
      }
    }

    if (body.probabilidade !== undefined) {
      const parsedProbability = Number(body.probabilidade)
      if (
        !Number.isInteger(parsedProbability) ||
        parsedProbability < 0 ||
        parsedProbability > 100
      ) {
        return NextResponse.json(
          { error: 'Probabilidade invalida' },
          { status: 400 }
        )
      }
      oportunidadeUpdateData.probabilidade = parsedProbability
    }

    if (body.clienteId !== undefined) {
      if (typeof body.clienteId !== 'string' || body.clienteId.trim() === '') {
        return NextResponse.json(
          { error: 'Cliente invalido' },
          { status: 400 }
        )
      }
      oportunidadeUpdateData.clienteId = body.clienteId.trim()
    }

    const normalizedParcelas = parseOptionalParcelas(body.parcelas)
    if (body.parcelas !== undefined && normalizedParcelas === undefined) {
      return NextResponse.json(
        { error: 'Parcelas invalidas (use um numero inteiro entre 1 e 24)' },
        { status: 400 }
      )
    }

    const normalizedDesconto = parseOptionalNonNegativeNumber(body.desconto)
    if (body.desconto !== undefined && normalizedDesconto === undefined) {
      return NextResponse.json(
        { error: 'Desconto invalido' },
        { status: 400 }
      )
    }

    const normalizedDataFechamento = parseOptionalDate(body.dataFechamento)
    if (body.dataFechamento !== undefined && body.dataFechamento && !normalizedDataFechamento) {
      return NextResponse.json(
        { error: 'Data prevista invalida' },
        { status: 400 }
      )
    }
    if (body.dataFechamento !== undefined) {
      oportunidadeUpdateData.dataFechamento = normalizedDataFechamento ?? null
    }

    const normalizedProximaAcao = parseOptionalDate(body.proximaAcaoEm)
    if (body.proximaAcaoEm !== undefined && body.proximaAcaoEm && !normalizedProximaAcao) {
      return NextResponse.json(
        { error: 'Data da proxima acao invalida' },
        { status: 400 }
      )
    }
    if (body.proximaAcaoEm !== undefined) {
      oportunidadeUpdateData.proximaAcaoEm = normalizedProximaAcao ?? null
    }

    const normalizedCanalProximaAcao = parseOptionalString(body.canalProximaAcao)
    if (
      normalizedCanalProximaAcao &&
      !ALLOWED_NEXT_ACTION_CHANNELS.has(normalizedCanalProximaAcao.toLowerCase())
    ) {
      return NextResponse.json(
        { error: 'Canal da proxima acao invalido' },
        { status: 400 }
      )
    }
    if (body.canalProximaAcao !== undefined) {
      oportunidadeUpdateData.canalProximaAcao = normalizedCanalProximaAcao
        ? normalizedCanalProximaAcao.toLowerCase()
        : null
    }

    const normalizedResponsavelProximaAcao = parseOptionalString(body.responsavelProximaAcao)
    if (body.responsavelProximaAcao !== undefined) {
      oportunidadeUpdateData.responsavelProximaAcao = normalizedResponsavelProximaAcao ?? null
    }

    if (body.lembreteProximaAcao !== undefined) {
      if (typeof body.lembreteProximaAcao !== 'boolean') {
        return NextResponse.json(
          { error: 'Lembrete da proxima acao invalido' },
          { status: 400 }
        )
      }
      oportunidadeUpdateData.lembreteProximaAcao = body.lembreteProximaAcao
    }

    const pedidoAtual = await prisma.pedido.findFirst({
      where: { id: (await params).id, userId },
      include: pedidoInclude,
    })

    if (!pedidoAtual) {
      return NextResponse.json(
        { error: 'Pedido nao encontrado' },
        { status: 404 }
      )
    }

    if (oportunidadeUpdateData.clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: oportunidadeUpdateData.clienteId, userId },
        select: { id: true },
      })
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente nao encontrado' },
          { status: 404 }
        )
      }
    }

    const formaPagamentoAtual =
      normalizeFormaPagamento(pedidoAtual.oportunidade.formaPagamento) ?? null
    const formaPagamentoEfetiva =
      normalizedFormaPagamento === undefined
        ? formaPagamentoAtual
        : normalizedFormaPagamento
    const parcelasEfetivas =
      normalizedParcelas === undefined
        ? pedidoAtual.oportunidade.parcelas
        : normalizedParcelas

    if (
      formaPagamentoEfetiva === 'parcelado' &&
      (parcelasEfetivas === null || parcelasEfetivas === undefined || parcelasEfetivas < 2)
    ) {
      return NextResponse.json(
        { error: 'Para pagamento parcelado, informe ao menos 2 parcelas' },
        { status: 400 }
      )
    }

    if (body.formaPagamento !== undefined) {
      oportunidadeUpdateData.formaPagamento = normalizedFormaPagamento ?? null
      if (formaPagamentoEfetiva !== 'parcelado') {
        oportunidadeUpdateData.parcelas = null
      }
    }

    if (body.parcelas !== undefined) {
      oportunidadeUpdateData.parcelas =
        formaPagamentoEfetiva === 'parcelado' ? normalizedParcelas ?? null : null
    }

    if (body.desconto !== undefined) {
      oportunidadeUpdateData.desconto = normalizedDesconto
    }

    if (
      Object.keys(pedidoUpdateData).length === 0 &&
      Object.keys(oportunidadeUpdateData).length === 0
    ) {
      return NextResponse.json(
        { error: 'Nenhum campo valido para atualizacao' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const pedidoAtualizado =
        Object.keys(pedidoUpdateData).length > 0
          ? await tx.pedido.update({
              where: { id: pedidoAtual.id },
              data: pedidoUpdateData,
              include: pedidoInclude,
            })
          : pedidoAtual

      if (Object.keys(oportunidadeUpdateData).length > 0) {
        await tx.oportunidade.updateMany({
          where: { id: pedidoAtual.oportunidade.id, userId },
          data: oportunidadeUpdateData,
        })
      }

      const oportunidadeAtual = await tx.oportunidade.findFirst({
        where: { id: pedidoAtual.oportunidade.id, userId },
        select: {
          id: true,
          clienteId: true,
          status: true,
          statusAnterior: true,
          valor: true,
        },
      })

      if (!oportunidadeAtual) {
        return { notFound: true as const }
      }

      const vendaConfirmada =
        pedidoAtualizado.statusEntrega === 'entregue' &&
        pedidoAtualizado.pagamentoConfirmado === true

      const oportunidadeEstaFechada = oportunidadeAtual.status === 'fechada'

      if (vendaConfirmada) {
        const valorConta =
          pedidoAtualizado.totalLiquido > 0
            ? pedidoAtualizado.totalLiquido
            : oportunidadeAtual.valor || 0
        const valorContaNormalizado = roundMoney(valorConta)

        const conta = await tx.contaReceber.upsert({
          where: { pedidoId: pedidoAtualizado.id },
          create: {
            userId,
            pedidoId: pedidoAtualizado.id,
            oportunidadeId: oportunidadeAtual.id,
            descricao: `Recebimento do pedido #${pedidoAtualizado.numero}`,
            tipo: 'receber',
            valorTotal: valorContaNormalizado,
            valorRecebido: valorContaNormalizado,
            status: 'pago',
            dataVencimento: pedidoAtualizado.dataEntrega || new Date(),
          },
          update: {
            oportunidadeId: oportunidadeAtual.id,
            descricao: `Recebimento do pedido #${pedidoAtualizado.numero}`,
            tipo: 'receber',
            valorTotal: valorContaNormalizado,
            valorRecebido: valorContaNormalizado,
            status: 'pago',
            dataVencimento: pedidoAtualizado.dataEntrega || new Date(),
          },
          select: { id: true },
        })

        const [entradasAgg, estornosAgg] = await Promise.all([
          tx.movimentoFinanceiro.aggregate({
            where: { userId, contaReceberId: conta.id, tipo: 'entrada' },
            _sum: { valor: true },
          }),
          tx.movimentoFinanceiro.aggregate({
            where: { userId, contaReceberId: conta.id, tipo: 'estorno' },
            _sum: { valor: true },
          }),
        ])

        const entradas = roundMoney(Number(entradasAgg._sum.valor || 0))
        const estornos = roundMoney(Number(estornosAgg._sum.valor || 0))
        const netRecebido = roundMoney(entradas - estornos)
        const delta = roundMoney(valorContaNormalizado - netRecebido)

        if (delta > 0) {
          await tx.movimentoFinanceiro.create({
            data: {
              userId,
              contaReceberId: conta.id,
              tipo: 'entrada',
              valor: delta,
              observacoes: 'Recebimento automatico ao confirmar venda no pedido',
            },
          })
        }
      }

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

        logBusinessEvent({
          event: 'pedido.venda_confirmada',
          userId,
          entity: 'pedido',
          entityId: (await params).id,
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
            status: oportunidadeAtual.statusAnterior || 'pedido',
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
          entityId: (await params).id,
          from: 'fechada',
          to: oportunidadeAtual.statusAnterior || 'pedido',
          metadata: {
            oportunidadeId: oportunidadeAtual.id,
          },
        })
      }

      const pedidoFinal = await tx.pedido.findFirst({
        where: { id: (await params).id, userId },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await prisma.pedido.deleteMany({
      where: { id: (await params).id, userId },
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

