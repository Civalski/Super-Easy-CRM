import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseLimit, parsePage } from '@/lib/validations/common'

const ALLOWED_STATUS_ENTREGA = new Set([
  'pendente',
  'em_preparacao',
  'enviado',
  'entregue',
])

export function normalizeStatusEntrega(status?: string | null): string | undefined {
  if (!status) return undefined
  const normalizedInput = status.trim().toLowerCase()
  const normalizedStatus =
    normalizedInput === 'em preparacao' ? 'em_preparacao' : normalizedInput
  return ALLOWED_STATUS_ENTREGA.has(normalizedStatus) ? normalizedStatus : undefined
}

const pedidoListInclude = {
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
      motivoPerda: true,
      probabilidade: true,
      dataFechamento: true,
      proximaAcaoEm: true,
      canalProximaAcao: true,
      responsavelProximaAcao: true,
      lembreteProximaAcao: true,
      createdAt: true,
      updatedAt: true,
      cliente: {
        select: {
          nome: true,
        },
      },
    },
  },
} as const

export type ListPedidosFilters = {
  statusEntrega?: string
  clienteId?: string
  search?: string
  formaPagamento?: string
  dataInicio?: string
  dataFim?: string
  /** 'vendas' | 'cancelados' - filtra por situacao e usa data relevante (dataEntrega/updatedAt) */
  aba?: string
}

export async function listPedidos(
  userId: string,
  options: {
    filters?: ListPedidosFilters
    paginated?: boolean
    limit?: number
    page?: number
  } = {}
) {
  const { filters = {}, paginated, limit = 20, page = 1 } = options
  const {
    statusEntrega: statusFilter,
    clienteId: clienteIdFilter,
    search: searchFilter,
    formaPagamento: formaPagamentoFilter,
    dataInicio: dataInicioFilter,
    dataFim: dataFimFilter,
    aba: abaFilter,
  } = filters

  const where: Prisma.PedidoWhereInput = { userId }

  const oportunidadeBase: Prisma.OportunidadeWhereInput = { userId }
  if (clienteIdFilter?.trim()) {
    oportunidadeBase.clienteId = clienteIdFilter.trim()
  }
  if (abaFilter === 'vendas') {
    oportunidadeBase.status = 'fechada'
    where.statusEntrega = 'entregue'
    where.pagamentoConfirmado = true
  } else if (abaFilter === 'cancelados') {
    oportunidadeBase.status = 'perdida'
  }
  if (Object.keys(oportunidadeBase).length > 1 || oportunidadeBase.status) {
    where.oportunidade = { is: oportunidadeBase }
  }

  if (searchFilter?.trim()) {
    const term = searchFilter.trim()
    const numMatch = term.match(/^\d+$/)
    const searchNum = numMatch ? Number(numMatch[0]) : null

    where.AND = [
      {
        OR: [
          ...(searchNum !== null ? [{ numero: searchNum }] : []),
          ...(searchNum !== null
            ? [
                {
                  oportunidade: {
                    is: {
                      userId,
                      cliente: {
                        is: {
                          numero: searchNum,
                        },
                      },
                    },
                  },
                },
              ]
            : []),
          {
            oportunidade: {
              is: {
                userId,
                cliente: {
                  is: {
                    nome: { contains: term, mode: 'insensitive' as const },
                  },
                },
              },
            },
          },
        ],
      },
    ]
  }

  if (statusFilter) {
    const statuses = Array.from(
      new Set(
        statusFilter
          .split(',')
          .map((s) => normalizeStatusEntrega(s))
          .filter((s): s is string => Boolean(s))
      )
    )
    if (statuses.length > 0) {
      where.statusEntrega = { in: statuses }
    }
  }

  if (formaPagamentoFilter?.trim()) {
    const normalized = formaPagamentoFilter.trim().toLowerCase()
    if (['pix', 'dinheiro', 'cartao', 'parcelado'].includes(normalized)) {
      where.formaPagamento = normalized
    }
  }

  if (dataInicioFilter || dataFimFilter) {
    const dateFilter: Prisma.DateTimeFilter = {}
    if (dataInicioFilter) {
      const dataInicio = new Date(dataInicioFilter)
      if (!Number.isNaN(dataInicio.getTime())) {
        dateFilter.gte = dataInicio
      }
    }
    if (dataFimFilter) {
      const dataFim = new Date(dataFimFilter)
      if (!Number.isNaN(dataFim.getTime())) {
        dataFim.setHours(23, 59, 59, 999)
        dateFilter.lte = dataFim
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      if (abaFilter === 'vendas') {
        where.OR = [
          { dataEntrega: dateFilter },
          { dataEntrega: null, dataAprovacao: dateFilter },
        ]
      } else if (abaFilter === 'cancelados') {
        where.oportunidade = {
          is: { ...oportunidadeBase, updatedAt: dateFilter },
        }
      } else {
        where.createdAt = dateFilter
      }
    }
  }

  const baseQuery = {
    where,
    orderBy: [{ createdAt: 'desc' as const }],
    include: pedidoListInclude,
  }

  if (paginated) {
    const take = Math.min(limit, 50)
    const skip = (page - 1) * take

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        ...baseQuery,
        skip,
        take,
      }),
      prisma.pedido.count({ where }),
    ])

    return {
      data: pedidos,
      meta: {
        total,
        page,
        limit: take,
        pages: Math.max(1, Math.ceil(total / take)),
      },
    }
  }

  const take = Math.min(limit, 50)
  return prisma.pedido.findMany({
    ...baseQuery,
    take,
  })
}
