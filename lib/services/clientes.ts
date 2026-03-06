import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { ClienteCreateInput } from '@/lib/validations/clientes'

const clienteListInclude = {
  _count: {
    select: {
      oportunidades: true,
      contatos: true,
    },
  },
  prospecto: {
    select: {
      cnaePrincipalDesc: true,
      capitalSocial: true,
    },
  },
} as const

const clienteOptionsSelect = {
  id: true,
  nome: true,
  email: true,
  empresa: true,
} as const

const normalizeDigits = (value: string) => value.replace(/\D/g, '')

export type ClienteCommercialStatusFilter =
  | 'sem_oportunidade'
  | 'oportunidade_aberta'
  | 'ativo'
  | 'inativo'

export type ClienteRevenueRangeFilter = 'ate_5000' | 'de_5000_a_20000' | 'acima_20000'

function buildClienteWhere({
  userId,
  profile,
  search,
  clienteCode,
  commercialStatus,
  lastPurchaseDays,
  lastContactDays,
  cidade,
  estado,
}: {
  userId: string
  profile?: 'b2b' | 'b2c'
  search?: string
  clienteCode?: number
  commercialStatus?: ClienteCommercialStatusFilter
  lastPurchaseDays?: number
  lastContactDays?: number
  cidade?: string
  estado?: string
}): Prisma.ClienteWhereInput {
  const andConditions: Prisma.ClienteWhereInput[] = [{ userId }]
  const now = new Date()

  if (profile === 'b2b') {
    andConditions.push({
      AND: [{ empresa: { not: null } }, { empresa: { not: '' } }],
    })
  }

  if (profile === 'b2c') {
    andConditions.push({
      OR: [{ empresa: null }, { empresa: '' }],
    })
  }

  if (typeof clienteCode === 'number' && Number.isInteger(clienteCode) && clienteCode > 0) {
    andConditions.push({ numero: clienteCode })
  }

  const normalizedCidade = cidade?.trim()
  if (normalizedCidade) {
    andConditions.push({
      cidade: { contains: normalizedCidade, mode: 'insensitive' },
    })
  }

  const normalizedEstado = estado?.trim().toUpperCase()
  if (normalizedEstado) {
    andConditions.push({
      estado: { equals: normalizedEstado, mode: 'insensitive' },
    })
  }

  if (typeof lastContactDays === 'number' && Number.isInteger(lastContactDays) && lastContactDays > 0) {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - lastContactDays)
    andConditions.push({
      oportunidades: {
        some: {
          updatedAt: { gte: cutoff },
        },
      },
    })
  }

  if (typeof lastPurchaseDays === 'number' && Number.isInteger(lastPurchaseDays) && lastPurchaseDays > 0) {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - lastPurchaseDays)
    andConditions.push({
      oportunidades: {
        some: {
          status: 'fechada',
          updatedAt: { gte: cutoff },
        },
      },
    })
  }

  if (commercialStatus) {
    const activeCutoff = new Date(now)
    activeCutoff.setDate(activeCutoff.getDate() - 90)

    if (commercialStatus === 'sem_oportunidade') {
      andConditions.push({
        oportunidades: { none: {} },
      })
    }

    if (commercialStatus === 'oportunidade_aberta') {
      andConditions.push({
        oportunidades: {
          some: {
            status: {
              in: ['sem_contato', 'em_potencial', 'orcamento', 'pedido'],
            },
          },
        },
      })
    }

    if (commercialStatus === 'ativo') {
      andConditions.push({
        oportunidades: {
          some: {
            status: 'fechada',
            updatedAt: { gte: activeCutoff },
          },
        },
      })
    }

    if (commercialStatus === 'inativo') {
      andConditions.push({
        AND: [
          {
            oportunidades: {
              some: {
                status: 'fechada',
              },
            },
          },
          {
            oportunidades: {
              none: {
                status: 'fechada',
                updatedAt: { gte: activeCutoff },
              },
            },
          },
        ],
      })
    }
  }

  const normalizedSearch = search?.trim()
  if (normalizedSearch) {
    const digits = normalizeDigits(normalizedSearch)
    const searchTerms = [normalizedSearch, digits].filter(
      (term, index, items) => term.length > 0 && items.indexOf(term) === index
    )

    const searchConditions: Prisma.ClienteWhereInput[] = searchTerms.flatMap((term) => [
      { nome: { contains: term, mode: 'insensitive' } },
      { telefone: { contains: term, mode: 'insensitive' } },
      { documento: { contains: term, mode: 'insensitive' } },
    ])

    const numericSearch = Number(digits)
    if (digits.length > 0 && Number.isInteger(numericSearch) && numericSearch > 0) {
      searchConditions.push({ numero: numericSearch })
    }

    andConditions.push({ OR: searchConditions })
  }

  return andConditions.length === 1 ? andConditions[0] : { AND: andConditions }
}

export async function listClientes(
  userId: string,
  options: {
    mode?: 'options'
    paginated?: boolean
    limit?: number
    page?: number
    profile?: 'b2b' | 'b2c'
    search?: string
    clienteCode?: number
    topCustomers?: boolean
    commercialStatus?: ClienteCommercialStatusFilter
    lastPurchaseDays?: number
    lastContactDays?: number
    cidade?: string
    estado?: string
    revenueRange?: ClienteRevenueRangeFilter
  } = {}
) {
  const {
    mode,
    paginated,
    limit = 20,
    page = 1,
    profile,
    search,
    clienteCode,
    topCustomers,
    commercialStatus,
    lastPurchaseDays,
    lastContactDays,
    cidade,
    estado,
    revenueRange,
  } = options
  const baseWhere = buildClienteWhere({
    userId,
    profile,
    search,
    clienteCode,
    commercialStatus,
    lastPurchaseDays,
    lastContactDays,
    cidade,
    estado,
  })

  let where = baseWhere
  if (revenueRange) {
    const grouped = await prisma.oportunidade.groupBy({
      by: ['clienteId'],
      where: {
        userId,
        status: 'fechada',
        cliente: {
          is: baseWhere,
        },
      },
      _sum: { valor: true },
    })

    const idsByRange = grouped
      .filter((item) => {
        const total = Number(item._sum.valor || 0)
        if (revenueRange === 'ate_5000') return total > 0 && total <= 5000
        if (revenueRange === 'de_5000_a_20000') return total > 5000 && total <= 20000
        return total > 20000
      })
      .map((item) => item.clienteId)

    if (idsByRange.length === 0) {
      where = {
        AND: [baseWhere, { id: '__no_results__' }],
      }
    } else {
      where = {
        AND: [baseWhere, { id: { in: idsByRange } }],
      }
    }
  }

  if (mode === 'options') {
    const take = Math.min(limit, 50)
    return prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: clienteOptionsSelect,
    })
  }

  if (paginated) {
    const take = Math.min(limit, 50)
    const skip = (page - 1) * take

    if (topCustomers) {
      const [rankedClientes, total] = await Promise.all([
        prisma.oportunidade.groupBy({
          by: ['clienteId'],
          where: {
            userId,
            status: 'fechada',
            cliente: {
              is: where,
            },
          },
          _sum: { valor: true },
          _count: { _all: true },
          orderBy: [{ _sum: { valor: 'desc' } }, { _count: { clienteId: 'desc' } }],
          skip,
          take,
        }),
        prisma.cliente.count({
          where: {
            AND: [where, { oportunidades: { some: { status: 'fechada' } } }],
          },
        }),
      ])

      const clienteIds = rankedClientes.map((item) => item.clienteId)
      const clientes = clienteIds.length
        ? await prisma.cliente.findMany({
            where: {
              userId,
              id: { in: clienteIds },
            },
            include: clienteListInclude,
          })
        : []

      const clienteById = new Map(clientes.map((cliente) => [cliente.id, cliente]))
      const data = rankedClientes
        .map((item) => clienteById.get(item.clienteId))
        .filter((item): item is (typeof clientes)[number] => Boolean(item))

      return {
        data,
        meta: {
          total,
          page,
          limit: take,
          pages: Math.max(1, Math.ceil(total / take)),
        },
      }
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: clienteListInclude,
      }),
      prisma.cliente.count({ where }),
    ])

    return {
      data: clientes,
      meta: {
        total,
        page,
        limit: take,
        pages: Math.max(1, Math.ceil(total / take)),
      },
    }
  }

  const take = Math.min(limit, 50)
  return prisma.cliente.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: clienteListInclude,
  })
}

export async function createCliente(
  userId: string,
  data: ClienteCreateInput
) {
  const email = data.email ?? null

  if (email) {
    const existente = await prisma.cliente.findFirst({
      where: { email, userId },
    })
    if (existente) {
      throw new Error('CLIENTE_EMAIL_DUPLICADO')
    }
  }

  return prisma.cliente.create({
    data: {
      userId,
      nome: data.nome,
      email,
      telefone: data.telefone ?? null,
      empresa: data.empresa ?? null,
      endereco: data.endereco ?? null,
      cidade: data.cidade ?? null,
      estado: data.estado ?? null,
      cep: data.cep ?? null,
      cargo: data.cargo ?? null,
      documento: data.documento ?? null,
      website: data.website ?? null,
      dataNascimento: data.dataNascimento ?? null,
      observacoes: data.observacoes ?? null,
      ...(data.camposPersonalizados && {
        camposPersonalizados: data.camposPersonalizados,
      }),
    },
    include: {
      _count: {
        select: {
          oportunidades: true,
          contatos: true,
        },
      },
    },
  })
}
