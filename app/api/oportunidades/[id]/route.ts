import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import {
  mapOpportunityStatusForResponse,
  normalizeOpportunityStatus,
} from '@/lib/domain/status'
import { logBusinessEvent } from '@/lib/observability/audit'

export const dynamic = 'force-dynamic'

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
  return parsed
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

function parseOptionalString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

async function normalizeLegacyOportunidade(userId: string, id: string) {
  await prisma.$transaction([
    prisma.oportunidade.updateMany({
      where: { id, userId, status: 'prospeccao' },
      data: { status: 'sem_contato' },
    }),
    prisma.oportunidade.updateMany({
      where: { id, userId, status: 'qualificacao' },
      data: { status: 'em_potencial' },
    }),
    prisma.oportunidade.updateMany({
      where: { id, userId, status: 'proposta' },
      data: { status: 'orcamento' },
    }),
    prisma.oportunidade.updateMany({
      where: { id, userId, status: 'negociacao' },
      data: { status: 'orcamento' },
    }),
  ])
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oportunidade = await prisma.oportunidade.findFirst({
      where: { id: (await params).id, userId },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
    })

    if (!oportunidade) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...oportunidade,
      status: mapOpportunityStatusForResponse(oportunidade.status),
      statusAnterior: mapOpportunityStatusForResponse(oportunidade.statusAnterior),
    })
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar orçamento' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await normalizeLegacyOportunidade(userId, (await params).id)

    const rawBody = await request.json().catch(() => null)
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: 'Payload invalido' },
        { status: 400 }
      )
    }

    const body = rawBody as Record<string, unknown>
    const {
      status,
      titulo,
      descricao,
      valor,
      probabilidade,
      clienteId,
      dataFechamento,
      motivoPerda,
      formaPagamento,
      parcelas,
      desconto,
      proximaAcaoEm,
      canalProximaAcao,
      responsavelProximaAcao,
      lembreteProximaAcao,
    } = body

    const oportunidadeAtual = await prisma.oportunidade.findFirst({
      where: { id: (await params).id, userId },
      select: {
        status: true,
        formaPagamento: true,
        parcelas: true,
        proximaAcaoEm: true,
        canalProximaAcao: true,
        responsavelProximaAcao: true,
        lembreteProximaAcao: true,
      },
    })

    if (!oportunidadeAtual) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    const normalizedStatusInput = normalizeOpportunityStatus(
      typeof status === 'string' ? status : undefined
    )
    if (status !== undefined && typeof status === 'string' && !normalizedStatusInput) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }
    if (normalizedStatusInput === 'fechada') {
      return NextResponse.json(
        { error: 'A venda e concluida automaticamente na aba Pedidos apos confirmar entrega e pagamento' },
        { status: 400 }
      )
    }
    const normalizedCurrentStatus =
      normalizeOpportunityStatus(oportunidadeAtual.status) || oportunidadeAtual.status
    const normalizedCurrentFormaPagamento =
      normalizeFormaPagamento(oportunidadeAtual.formaPagamento) ?? null

    const updateData: {
      status?: string
      titulo?: string
      descricao?: string | null
      valor?: number | null
      probabilidade?: number
      clienteId?: string
      dataFechamento?: Date | null
      motivoPerda?: string | null
      formaPagamento?: string | null
      parcelas?: number | null
      desconto?: number | null
      statusAnterior?: string | null
      proximaAcaoEm?: Date | null
      canalProximaAcao?: string | null
      responsavelProximaAcao?: string | null
      lembreteProximaAcao?: boolean
    } = {}
    let statusAutoAtualizado = false
    const effectiveStatus = normalizedStatusInput ?? normalizedCurrentStatus
    const isFechadaOuPerdida = effectiveStatus === 'fechada' || effectiveStatus === 'perdida'
    const tinhaStatusFechadaOuPerdida =
      normalizedCurrentStatus === 'fechada' || normalizedCurrentStatus === 'perdida'
    const hasDataFechamento = dataFechamento !== undefined
    const precisaMotivoPerda = effectiveStatus === 'perdida' && !tinhaStatusFechadaOuPerdida

    if (precisaMotivoPerda && (!motivoPerda || String(motivoPerda).trim() === '')) {
      return NextResponse.json(
        { error: 'Informe o motivo da perda' },
        { status: 400 }
      )
    }

    if (status !== undefined && typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    if (status !== undefined) {
      updateData.status = normalizedStatusInput
      if (normalizedStatusInput && normalizedStatusInput !== status) {
        statusAutoAtualizado = true
      }
    }

    if (titulo !== undefined) {
      if (typeof titulo !== 'string' || titulo.trim() === '') {
        return NextResponse.json(
          { error: 'Titulo invalido' },
          { status: 400 }
        )
      }
      updateData.titulo = titulo.trim()
    }

    if (descricao !== undefined) {
      if (descricao !== null && typeof descricao !== 'string') {
        return NextResponse.json(
          { error: 'Descricao invalida' },
          { status: 400 }
        )
      }
      updateData.descricao =
        typeof descricao === 'string' && descricao.trim() !== '' ? descricao.trim() : null
    }

    if (valor !== undefined) {
      if (valor === null || valor === '') {
        updateData.valor = null
      } else {
        const parsedValue = Number(valor)
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
          return NextResponse.json(
            { error: 'Valor invalido' },
            { status: 400 }
          )
        }
        updateData.valor = parsedValue
      }
    }

    if (probabilidade !== undefined) {
      const parsedProbability = Number(probabilidade)
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
      updateData.probabilidade = parsedProbability
    }

    if (clienteId !== undefined) {
      if (typeof clienteId !== 'string' || clienteId.trim() === '') {
        return NextResponse.json(
          { error: 'Cliente invalido' },
          { status: 400 }
        )
      }
      updateData.clienteId = clienteId.trim()
    }

    if (dataFechamento !== undefined) {
      if (dataFechamento === null || dataFechamento === '') {
        updateData.dataFechamento = null
      } else {
        const parsedDate = new Date(String(dataFechamento))
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: 'Data de fechamento invalida' },
            { status: 400 }
          )
        }
        updateData.dataFechamento = parsedDate
      }
    }

    if (motivoPerda !== undefined) {
      if (motivoPerda !== null && typeof motivoPerda !== 'string') {
        return NextResponse.json(
          { error: 'Motivo de perda invalido' },
          { status: 400 }
        )
      }
      updateData.motivoPerda = motivoPerda && String(motivoPerda).trim() !== ''
        ? String(motivoPerda).trim()
        : null
    }

    const normalizedFormaPagamento = normalizeFormaPagamento(formaPagamento)
    if (formaPagamento !== undefined && normalizedFormaPagamento === undefined) {
      return NextResponse.json(
        { error: 'Forma de pagamento invalida' },
        { status: 400 }
      )
    }

    const normalizedParcelas = parseOptionalParcelas(parcelas)
    if (parcelas !== undefined && normalizedParcelas === undefined) {
      return NextResponse.json(
        { error: 'Parcelas invalidas (use um numero inteiro entre 1 e 24)' },
        { status: 400 }
      )
    }

    const normalizedDesconto = parseOptionalNonNegativeNumber(desconto)
    if (desconto !== undefined && normalizedDesconto === undefined) {
      return NextResponse.json(
        { error: 'Desconto invalido' },
        { status: 400 }
      )
    }

    const normalizedProximaAcao = parseOptionalDate(proximaAcaoEm)
    if (proximaAcaoEm !== undefined && normalizedProximaAcao === undefined) {
      return NextResponse.json(
        { error: 'Data da proxima acao invalida' },
        { status: 400 }
      )
    }

    const normalizedCanalProximaAcao = parseOptionalString(canalProximaAcao)
    if (
      normalizedCanalProximaAcao &&
      !ALLOWED_NEXT_ACTION_CHANNELS.has(normalizedCanalProximaAcao.toLowerCase())
    ) {
      return NextResponse.json(
        { error: 'Canal da proxima acao invalido' },
        { status: 400 }
      )
    }

    const normalizedResponsavelProximaAcao = parseOptionalString(responsavelProximaAcao)

    const effectiveFormaPagamento =
      normalizedFormaPagamento === undefined
        ? normalizedCurrentFormaPagamento
        : normalizedFormaPagamento
    const effectiveParcelas =
      normalizedParcelas === undefined
        ? oportunidadeAtual.parcelas
        : normalizedParcelas

    if (
      effectiveFormaPagamento === 'parcelado' &&
      (effectiveParcelas === null || effectiveParcelas === undefined || effectiveParcelas < 2)
    ) {
      return NextResponse.json(
        { error: 'Para pagamento parcelado, informe ao menos 2 parcelas' },
        { status: 400 }
      )
    }

    if (formaPagamento !== undefined) {
      updateData.formaPagamento = normalizedFormaPagamento ?? null
      if (effectiveFormaPagamento !== 'parcelado') {
        updateData.parcelas = null
      }
    }

    if (parcelas !== undefined && effectiveFormaPagamento === 'parcelado') {
      updateData.parcelas = normalizedParcelas ?? null
    } else if (parcelas !== undefined && effectiveFormaPagamento !== 'parcelado') {
      updateData.parcelas = null
    }

    if (desconto !== undefined) {
      updateData.desconto = normalizedDesconto
    }

    if (proximaAcaoEm !== undefined) {
      updateData.proximaAcaoEm = normalizedProximaAcao ?? null
    }

    if (canalProximaAcao !== undefined) {
      updateData.canalProximaAcao = normalizedCanalProximaAcao
        ? normalizedCanalProximaAcao.toLowerCase()
        : null
    }

    if (responsavelProximaAcao !== undefined) {
      updateData.responsavelProximaAcao = normalizedResponsavelProximaAcao ?? null
    }

    if (lembreteProximaAcao !== undefined) {
      if (typeof lembreteProximaAcao !== 'boolean') {
        return NextResponse.json(
          { error: 'Lembrete da proxima acao invalido' },
          { status: 400 }
        )
      }
      updateData.lembreteProximaAcao = lembreteProximaAcao
    }

    if (status === undefined && normalizedCurrentStatus !== oportunidadeAtual.status) {
      updateData.status = normalizedCurrentStatus
      statusAutoAtualizado = true
    }

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, userId },
        select: { id: true },
      })
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        )
      }
    }

    if (status !== undefined && isFechadaOuPerdida && !tinhaStatusFechadaOuPerdida) {
      updateData.statusAnterior = normalizedCurrentStatus
      if (!hasDataFechamento) {
        updateData.dataFechamento = new Date()
      }
    }

    const updated = await prisma.oportunidade.updateMany({
      where: { id: (await params).id, userId },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // ===== AUTO-CONVERSÃO DE PROSPECTO QUANDO VENDA É FECHADA =====
    // Se a oportunidade foi fechada (virou venda), verificar se o cliente
    // vinculado originou-se de um prospecto ainda não convertido e convertê-lo.
    const novoStatus = updateData.status ?? effectiveStatus
    const eraAberta = !tinhaStatusFechadaOuPerdida
    let prospectoConvertidoAutomaticamente = false

    if (novoStatus === 'fechada' && eraAberta) {
      // Buscar a oportunidade atualizada com clienteId
      const oportunidadeComCliente = await prisma.oportunidade.findFirst({
        where: { id: (await params).id, userId },
        select: { clienteId: true },
      })

      if (oportunidadeComCliente?.clienteId) {
        // Verificar se esse cliente possui um prospecto vinculado que ainda não foi convertido
        const prospectoVinculado = await prisma.prospecto.findFirst({
          where: {
            clienteId: oportunidadeComCliente.clienteId,
            userId,
            status: { not: 'convertido' },
          },
          select: { id: true },
        })

        if (prospectoVinculado) {
          await prisma.prospecto.update({
            where: { id: prospectoVinculado.id },
            data: { status: 'convertido' },
          })
          prospectoConvertidoAutomaticamente = true
        }
      }
    }

    if (updateData.status && updateData.status !== normalizedCurrentStatus) {
      logBusinessEvent({
        event: 'oportunidade.status_changed',
        userId,
        entity: 'oportunidade',
        entityId: (await params).id,
        from: normalizedCurrentStatus,
        to: updateData.status,
        metadata: {
          statusAutoAtualizado,
          motivoPerda: updateData.motivoPerda ?? null,
        },
      })
    }

    const oportunidadeAtualizada = await prisma.oportunidade.findFirst({
      where: { id: (await params).id, userId },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
    })

    return NextResponse.json({
      ...oportunidadeAtualizada,
      status: mapOpportunityStatusForResponse(oportunidadeAtualizada?.status),
      statusAnterior: mapOpportunityStatusForResponse(oportunidadeAtualizada?.statusAnterior),
      statusAutoAtualizado,
      prospectoConvertidoAutomaticamente,
    })
  } catch (error: unknown) {
    console.error('Erro ao atualizar orçamento:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar orçamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.oportunidade.deleteMany({
      where: { id: (await params).id, userId },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao deletar orçamento:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao deletar orçamento' },
      { status: 500 }
    )
  }
}



