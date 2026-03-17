import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getUserIdFromRequest } from '@/lib/auth'
import { getUserSubscriptionAccess } from '@/lib/billing/subscription-access'
import {
  runWithPrismaQueryContext,
  setPrismaQueryContextUserId,
} from '@/lib/observability/prisma-query-context'

type RouteContextOptions = {
  userId?: string
}

function getPathnameFromRequest(request: Request) {
  try {
    return new URL(request.url).pathname
  } catch {
    return 'unknown'
  }
}

function shouldBypassSubscriptionGuard(pathname: string) {
  return (
    pathname.startsWith('/api/billing/') ||
    pathname.startsWith('/api/users/me/onboarding') ||
    pathname.startsWith('/api/users/me/account')
  )
}

/**
 * Envolve o handler com contexto de request para correlacionar queries com rota e metodo.
 */
export function withRouteContext<T>(
  request: Request,
  handler: () => Promise<T>,
  options?: RouteContextOptions
): Promise<T> {
  return runWithPrismaQueryContext(
    {
      method: request.method,
      route: getPathnameFromRequest(request),
      userId: options?.userId,
    },
    handler
  )
}

/**
 * Executa o handler apenas se o usuario estiver autenticado.
 * Retorna 401 automaticamente se nao houver userId.
 */
export async function withAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  return withRouteContext(request, async () => {
    const pathname = getPathnameFromRequest(request)
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    setPrismaQueryContextUserId(userId)

    if (!shouldBypassSubscriptionGuard(pathname)) {
      const access = await getUserSubscriptionAccess(userId)
      if (!access.schemaReady) {
        return NextResponse.json(
          {
            error:
              'Nao foi possivel validar assinatura. Execute a migracao do Prisma e reinicie o servidor.',
            code: 'SUBSCRIPTION_SCHEMA_MISSING',
          },
          { status: 503 }
        )
      }

      if (!access.active) {
        return NextResponse.json(
          {
            error:
              'Acesso inativo. Confirme seu email para liberar os 7 dias gratis ou assine um plano para continuar usando o CRM.',
            code: 'SUBSCRIPTION_REQUIRED',
            status: access.status,
          },
          { status: 402 }
        )
      }
    }

    return handler(userId)
  })
}

/**
 * Formata erros do Zod para resposta 400 consistente.
 */
export function zodErrorResponse(error: ZodError): NextResponse {
  const flattened = error.flatten()
  const firstFieldError = Object.values(flattened.fieldErrors).flat()[0]
  const message =
    typeof firstFieldError === 'string' ? firstFieldError : 'Dados invalidos'

  return NextResponse.json(
    { error: message, details: flattened.fieldErrors },
    { status: 400 }
  )
}
