import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type CampoPersonalizado = {
  label: string
  value: string
}

const normalizeOptionalString = (
  value: unknown,
  options: { maxLength?: number; upperCase?: boolean } = {}
) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = options.upperCase ? trimmed.toUpperCase() : trimmed
  if (options.maxLength && normalized.length > options.maxLength) {
    return normalized.slice(0, options.maxLength)
  }
  return normalized
}

const sanitizeCamposPersonalizados = (value: unknown): CampoPersonalizado[] | null => {
  if (!Array.isArray(value)) return null

  const campos = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const field = item as { label?: unknown; value?: unknown }
      const label = normalizeOptionalString(field.label, { maxLength: 80 })
      if (!label) return null
      const fieldValue = normalizeOptionalString(field.value, { maxLength: 500 }) ?? ''
      return { label, value: fieldValue }
    })
    .filter((item): item is CampoPersonalizado => item !== null)
    .slice(0, 20)

  return campos.length > 0 ? campos : null
}

const parseLimit = (value: string | null, fallback = 200, max = 500) => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(1, parsed))
}

const parsePage = (value: string | null, fallback = 1) => {
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
    const mode = searchParams.get('mode')
    const paginated = searchParams.get('paginated') === 'true'

    if (mode === 'options') {
      const limit = parseLimit(searchParams.get('limit'))
      const clientes = await prisma.cliente.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        select: {
          id: true,
          nome: true,
          email: true,
          empresa: true,
        },
      })

      return NextResponse.json(clientes)
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'), 25, 100)
      const skip = (page - 1) * limit

      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where: { userId },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
          include: {
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
          },
        }),
        prisma.cliente.count({ where: { userId } }),
      ])

      return NextResponse.json({
        data: clientes,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    }

    const clientes = await prisma.cliente.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
      },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
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
      nome,
      email,
      telefone,
      empresa,
      endereco,
      cidade,
      estado,
      cep,
      cargo,
      documento,
      website,
      dataNascimento,
      observacoes,
      camposPersonalizados,
    } = body

    const nomeNormalizado = normalizeOptionalString(nome, { maxLength: 120 })
    if (!nomeNormalizado) {
      return NextResponse.json(
        { error: 'Nome e obrigatorio' },
        { status: 400 }
      )
    }

    const emailNormalizado = normalizeOptionalString(email, { maxLength: 120 })
    const camposPersonalizadosSanitizados = sanitizeCamposPersonalizados(camposPersonalizados)

    if (emailNormalizado) {
      const clienteExistente = await prisma.cliente.findFirst({
        where: { email: emailNormalizado, userId },
      })
      if (clienteExistente) {
        return NextResponse.json(
          { error: 'Ja existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    const novoCliente = await prisma.cliente.create({
      data: {
        userId,
        nome: nomeNormalizado,
        email: emailNormalizado,
        telefone: normalizeOptionalString(telefone, { maxLength: 30 }),
        empresa: normalizeOptionalString(empresa, { maxLength: 120 }),
        endereco: normalizeOptionalString(endereco, { maxLength: 200 }),
        cidade: normalizeOptionalString(cidade, { maxLength: 80 }),
        estado: normalizeOptionalString(estado, { maxLength: 2, upperCase: true }),
        cep: normalizeOptionalString(cep, { maxLength: 12 }),
        cargo: normalizeOptionalString(cargo, { maxLength: 100 }),
        documento: normalizeOptionalString(documento, { maxLength: 30 }),
        website: normalizeOptionalString(website, { maxLength: 200 }),
        dataNascimento: normalizeOptionalString(dataNascimento, { maxLength: 20 }),
        observacoes: normalizeOptionalString(observacoes, { maxLength: 2000 }),
        ...(camposPersonalizadosSanitizados && {
          camposPersonalizados: camposPersonalizadosSanitizados,
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

    return NextResponse.json(novoCliente, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar cliente:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ja existe um cliente com este email' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}
