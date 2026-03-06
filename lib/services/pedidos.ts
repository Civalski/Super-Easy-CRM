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

export type ListPedidosFilters = {
  statusEntrega?: string
  clienteId?: string
  search?: string
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
  const { statusEntrega: statusFilter, clienteId: clienteIdFilter, search: searchFilter } = filters

  const where: Prisma.PedidoWhereInput = { userId }

  if (clienteIdFilter?.trim()) {
    where.oportunidade = {
      is: {
        userId,
        clienteId: clienteIdFilter.trim(),
      },
    }
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
