import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import {
  expandOpportunityStatuses,
  mapOpportunityStatusForResponse,
  normalizeOpportunityStatus,
  type OpportunityStatus,
} from '@/lib/domain/status'

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

function parseLimit(value: string | null, fallback = 20, max = 50) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(1, parsed))
}

function parsePage(value: string | null, fallback = 1) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.max(1, parsed)
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const clienteIdFilter = searchParams.get('clienteId')?.trim()
    const possuiPedidoFilterRaw = searchParams.get('possuiPedido')?.trim().toLowerCase()
    const mode = searchParams.get('mode')
    const paginated = searchParams.get('paginated') === 'true'

    const where: Prisma.OportunidadeWhereInput = { userId }
    if (clienteIdFilter) {
      where.clienteId = clienteIdFilter
    }
    if (possuiPedidoFilterRaw === 'true') {
      where.pedido = { isNot: null }
    } else if (possuiPedidoFilterRaw === 'false') {
      where.pedido = { is: null }
    }
    if (statusFilter) {
      const statuses = Array.from(
        new Set(
          statusFilter
            .split(',')
            .map((s) => normalizeOpportunityStatus(s.trim()))
            .filter((s): s is OpportunityStatus => Boolean(s))
        )
      )
      const expandedStatuses = expandOpportunityStatuses(statuses)
      if (expandedStatuses.length === 0) {
        if (paginated) {
          const page = parsePage(searchParams.get('page'))
          const limit = parseLimit(searchParams.get('limit'), 20, 50)
          return NextResponse.json({
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              pages: 1,
            },
          })
        }
        return NextResponse.json([])
      }
      where.status = { in: expandedStatuses }
    }

    if (mode === 'options') {
      const limit = parseLimit(searchParams.get('limit'))
      const oportunidades = await prisma.oportunidade.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          titulo: true,
          status: true,
        },
      })

      return NextResponse.json(
        oportunidades.map((oportunidade) => ({
          ...oportunidade,
          status: mapOpportunityStatusForResponse(oportunidade.status),
        }))
      )
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'), 20, 50)
      const skip = (page - 1) * limit

      const [oportunidades, total] = await Promise.all([
        prisma.oportunidade.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
          include: {
            cliente: {
              select: {
                nome: true,
              },
            },
            pedido: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        }),
        prisma.oportunidade.count({ where }),
      ])

      const data = oportunidades.map((oportunidade) => ({
        ...oportunidade,
        status: mapOpportunityStatusForResponse(oportunidade.status),
        statusAnterior: mapOpportunityStatusForResponse(oportunidade.statusAnterior),
      }))

      return NextResponse.json({
        data,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    }

    const limit = parseLimit(searchParams.get('limit'))
    const oportunidades = await prisma.oportunidade.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    })

    const oportunidadesNormalizadas = oportunidades.map((oportunidade) => ({
      ...oportunidade,
      status: mapOpportunityStatusForResponse(oportunidade.status),
      statusAnterior: mapOpportunityStatusForResponse(oportunidade.statusAnterior),
    }))

    return NextResponse.json(oportunidadesNormalizadas)
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar orçamentos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      titulo,
      descricao,
      valor,
      status,
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

    // Validacao basica
    if (!titulo || titulo.trim() === '') {
      return NextResponse.json(
        { error: 'Titulo e obrigatorio' },
        { status: 400 }
      )
    }

    if (!clienteId || clienteId.trim() === '') {
      return NextResponse.json(
        { error: 'Cliente e obrigatorio' },
        { status: 400 }
      )
    }

    // Verifica se o cliente existe
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, userId },
    })
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }



    const normalizedStatus = normalizeOpportunityStatus(
      typeof status === 'string' ? status : undefined
    )

    if (status !== undefined && typeof status === 'string' && !normalizedStatus) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    if (normalizedStatus === 'fechada') {
      return NextResponse.json(
        { error: 'A venda e concluida automaticamente na aba Pedidos apos confirmar entrega e pagamento' },
        { status: 400 }
      )
    }

    if (normalizedStatus === 'perdida' && (!motivoPerda || String(motivoPerda).trim() === '')) {
      return NextResponse.json(
        { error: 'Informe o motivo da perda' },
        { status: 400 }
      )
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

    if (normalizedFormaPagamento === 'parcelado' && (!normalizedParcelas || normalizedParcelas < 2)) {
      return NextResponse.json(
        { error: 'Para pagamento parcelado, informe ao menos 2 parcelas' },
        { status: 400 }
      )
    }

    const parcelasFinais =
      normalizedFormaPagamento === 'parcelado' ? normalizedParcelas ?? null : null

    // Mantem o pipeline simplificado sem etapas antigas.
    const finalStatus = normalizedStatus || 'orcamento'
    const statusAutoAtualizado = Boolean(
      typeof status === 'string' && normalizedStatus && status !== normalizedStatus
    )
    const shouldCreateReminderTask = lembreteProximaAcao === true && Boolean(normalizedProximaAcao)

    const novaOportunidade = await prisma.$transaction(async (tx) => {
      const created = await tx.oportunidade.create({
        data: {
          userId,
          titulo: titulo.trim(),
          descricao: descricao && descricao.trim() !== '' ? descricao.trim() : null,
          valor:
            valor === null || valor === '' || valor === undefined
              ? null
              : parseFloat(String(valor)),
          status: finalStatus,
          probabilidade: probabilidade ? parseInt(String(probabilidade)) : 0,
          dataFechamento: dataFechamento ? new Date(dataFechamento) : null,
          motivoPerda: motivoPerda ? String(motivoPerda).trim() : null,
          formaPagamento: normalizedFormaPagamento ?? null,
          parcelas: parcelasFinais,
          desconto: normalizedDesconto ?? null,
          proximaAcaoEm: normalizedProximaAcao === undefined ? null : normalizedProximaAcao,
          canalProximaAcao:
            normalizedCanalProximaAcao === undefined
              ? null
              : normalizedCanalProximaAcao?.toLowerCase() ?? null,
          responsavelProximaAcao:
            normalizedResponsavelProximaAcao === undefined
              ? null
              : normalizedResponsavelProximaAcao,
          lembreteProximaAcao: lembreteProximaAcao === true,
          clienteId,
        },
        include: {
          cliente: {
            select: {
              nome: true,
            },
          },
        },
      })

      if (shouldCreateReminderTask && normalizedProximaAcao) {
        const canalLabel = normalizedCanalProximaAcao
          ? `Canal: ${normalizedCanalProximaAcao}.`
          : null
        const responsavelLabel = normalizedResponsavelProximaAcao
          ? `Responsavel: ${normalizedResponsavelProximaAcao}.`
          : null

        await tx.tarefa.create({
          data: {
            userId,
            titulo: `Proxima acao do orçamento: ${created.titulo}`,
            descricao: [canalLabel, responsavelLabel].filter(Boolean).join(' '),
            status: 'pendente',
            prioridade: 'media',
            dataVencimento: normalizedProximaAcao,
            clienteId,
            oportunidadeId: created.id,
            notificar: true,
          },
        })
      }

      return created
    })

    return NextResponse.json(
      {
        ...novaOportunidade,
        status: mapOpportunityStatusForResponse(novaOportunidade.status),
        statusAnterior: mapOpportunityStatusForResponse(novaOportunidade.statusAnterior),
        statusAutoAtualizado,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao criar orçamento:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente nao encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar orçamento' },
      { status: 500 }
    )
  }
}


