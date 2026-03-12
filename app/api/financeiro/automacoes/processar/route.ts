import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRouteContext } from '@/lib/api/route-helpers'
import { processFinanceAutomation } from '@/lib/financeiro/automation'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'
import { heavyRoutesDisabledResponse, isHeavyRoutesDisabled } from '@/lib/security/heavy-routes'

export const dynamic = 'force-dynamic'

const schedulerRateLimitConfig = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 1,
  blockDurationMs: 5 * 60 * 1000,
}

const DEFAULT_MONTHS_AHEAD = 6
const DEFAULT_USERS_LIMIT = 200
const MAX_USERS_LIMIT = 500
const MAX_FAILURES_IN_RESPONSE = 30

function parsePositiveInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number
) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function resolveSchedulerSecret() {
  const candidates = [
    process.env.FINANCE_SCHEDULER_SECRET,
    process.env.CRON_SECRET,
    process.env.LEADS_SCHEDULER_SECRET,
  ]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)

  return candidates[0] ?? ''
}

function hasSchedulerSecret(request: NextRequest) {
  const secret = resolveSchedulerSecret()
  if (!secret) return false

  const headerSecret = request.headers.get('x-scheduler-secret')?.trim()
  if (headerSecret === secret) return true

  const authHeader = request.headers.get('authorization')?.trim()
  return authHeader === `Bearer ${secret}`
}

function simplifyError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500)
  }
  return 'Erro inesperado'
}

async function resolveTargetUserIds(limit: number) {
  const users = await prisma.contaReceber.findMany({
    where: {
      OR: [
        {
          tipo: 'pagar',
          autoDebito: true,
          status: { in: ['pendente', 'parcial', 'atrasado'] },
          dataVencimento: { lte: new Date() },
        },
        {
          recorrenteMensal: true,
          recorrenciaAtiva: true,
        },
      ],
    },
    select: { userId: true },
    distinct: ['userId'],
    orderBy: { userId: 'asc' },
    take: limit,
  })

  return users.map((user) => user.userId)
}

async function processar(request: NextRequest) {
  try {
    if (isHeavyRoutesDisabled()) {
      return heavyRoutesDisabledResponse()
    }

    if (!hasSchedulerSecret(request)) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'Informe x-scheduler-secret ou Authorization Bearer valido.',
        },
        { status: 401 }
      )
    }

    const rateLimitResponse = enforceApiRateLimit({
      key: 'api:financeiro:automacoes:processar:global',
      config: schedulerRateLimitConfig,
      error: 'Processamento financeiro em cooldown. Tente novamente em alguns minutos.',
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const monthsAhead = parsePositiveInt(
      searchParams.get('monthsAhead'),
      DEFAULT_MONTHS_AHEAD,
      1,
      24
    )
    const limit = parsePositiveInt(
      searchParams.get('limit'),
      DEFAULT_USERS_LIMIT,
      1,
      MAX_USERS_LIMIT
    )
    const userId = searchParams.get('userId')?.trim() || ''

    const targetUserIds = userId ? [userId] : await resolveTargetUserIds(limit)
    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        monthsAhead,
        totalTargets: 0,
        processados: 0,
        erros: 0,
      })
    }

    let processados = 0
    let erros = 0
    const failures: Array<{ userId: string; error: string }> = []

    for (const currentUserId of targetUserIds) {
      try {
        await processFinanceAutomation(currentUserId, monthsAhead)
        processados += 1
      } catch (error) {
        erros += 1
        failures.push({
          userId: currentUserId,
          error: simplifyError(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      monthsAhead,
      totalTargets: targetUserIds.length,
      processados,
      erros,
      failures: failures.slice(0, MAX_FAILURES_IN_RESPONSE),
    })
  } catch (error) {
    console.error('Erro ao processar automacoes financeiras:', error)
    return NextResponse.json(
      { error: 'Erro ao processar automacoes financeiras' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return withRouteContext(request, () => processar(request))
}

export async function GET(request: NextRequest) {
  return withRouteContext(request, () => processar(request))
}
