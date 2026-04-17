import { NextRequest, NextResponse } from 'next/server'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { listClientes, createCliente } from '@/lib/services/clientes'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'
import { clienteCreateSchema } from '@/lib/validations/clientes'
import { parseLimit, parsePage } from '@/lib/validations/common'
export const dynamic = 'force-dynamic'

const clientesListRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 30,
  blockDurationMs: 60 * 1000,
} as const

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    const rateLimitResponse = await enforceApiRateLimit({
      key: `api:clientes:user:${userId}`,
      config: clientesListRateLimitConfig,
      error: 'Muitas requisicoes em pouco tempo. Aguarde alguns segundos.',
    })
    if (rateLimitResponse) return rateLimitResponse

    try {
      const { searchParams } = new URL(request.url)
      const mode = searchParams.get('mode')
      const paginated = searchParams.get('paginated') === 'true'
      const rawProfile = searchParams.get('profile')
      const rawSearch = searchParams.get('search')
      const rawClienteCode = searchParams.get('clienteCode')
      const topCustomers = searchParams.get('topCustomers') === 'true'
      const rawCommercialStatus = searchParams.get('commercialStatus')
      const rawLastPurchaseDays = searchParams.get('lastPurchaseDays')
      const rawLastContactDays = searchParams.get('lastContactDays')
      const rawCidade = searchParams.get('cidade')
      const rawEstado = searchParams.get('estado')
      const rawRevenueRange = searchParams.get('revenueRange')
      const profile = rawProfile === 'b2b' || rawProfile === 'b2c' ? rawProfile : undefined
      const search = rawSearch?.trim() || undefined
      const clienteCode =
        rawClienteCode && /^\d+$/.test(rawClienteCode.trim())
          ? Number(rawClienteCode.trim())
          : undefined
      const commercialStatus =
        rawCommercialStatus === 'sem_oportunidade' ||
        rawCommercialStatus === 'oportunidade_aberta' ||
        rawCommercialStatus === 'ativo' ||
        rawCommercialStatus === 'inativo'
          ? rawCommercialStatus
          : undefined
      const lastPurchaseDays =
        rawLastPurchaseDays && /^(30|90|180|365)$/.test(rawLastPurchaseDays)
          ? Number(rawLastPurchaseDays)
          : undefined
      const lastContactDays =
        rawLastContactDays && /^(30|90|180)$/.test(rawLastContactDays)
          ? Number(rawLastContactDays)
          : undefined
      const cidade = rawCidade?.trim() || undefined
      const estado = rawEstado?.trim() || undefined
      const revenueRange =
        rawRevenueRange === 'ate_5000' ||
        rawRevenueRange === 'de_5000_a_20000' ||
        rawRevenueRange === 'acima_20000'
          ? rawRevenueRange
          : undefined

      const limit =
        mode === 'options'
          ? parseLimit(searchParams.get('limit'))
          : parseLimit(searchParams.get('limit'), 25, 25)
      const page = parsePage(searchParams.get('page'))

      const result = await listClientes(userId, {
        mode: mode === 'options' ? 'options' : undefined,
        paginated: paginated || undefined,
        limit,
        page,
        profile,
        search,
        clienteCode,
        topCustomers: topCustomers || undefined,
        commercialStatus,
        lastPurchaseDays,
        lastContactDays,
        cidade,
        estado,
        revenueRange,
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json()
      const parsed = clienteCreateSchema.safeParse(body)

      if (!parsed.success) {
        return zodErrorResponse(parsed.error)
      }

      const novoCliente = await createCliente(userId, parsed.data)
      return NextResponse.json(novoCliente, { status: 201 })
    } catch (error: unknown) {
      console.error('Erro ao criar cliente:', error)

      if (error instanceof Error && error.message === 'CLIENTE_EMAIL_DUPLICADO') {
        return NextResponse.json(
          { error: 'Ja existe um cliente com este email' },
          { status: 400 }
        )
      }

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
  })
}
