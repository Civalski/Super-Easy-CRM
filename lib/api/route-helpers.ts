import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth'
import { ZodError } from 'zod'

/**
 * Executa o handler apenas se o usuário estiver autenticado.
 * Retorna 401 automaticamente se não houver userId.
 */
export async function withAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return handler(userId)
}

/**
 * Formata erros do Zod para resposta 400 consistente.
 */
export function zodErrorResponse(error: ZodError): NextResponse {
  const flattened = error.flatten()
  const firstFieldError = Object.values(flattened.fieldErrors).flat()[0]
  const message =
    typeof firstFieldError === 'string'
      ? firstFieldError
      : 'Dados inválidos'
  return NextResponse.json(
    { error: message, details: flattened.fieldErrors },
    { status: 400 }
  )
}
