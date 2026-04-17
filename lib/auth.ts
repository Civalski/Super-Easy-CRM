import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getNextAuthSecret } from '@/lib/nextauth-secret'
import { isActiveUserSession } from '@/lib/auth-session'

export async function getAuthIdentityFromRequest(req: NextRequest): Promise<{
  userId?: string
  role?: string
}> {
  const token = await getToken({ req, secret: getNextAuthSecret() })
  if (!token) return {}

  const role = typeof token.role === 'string' && token.role.length > 0 ? token.role : undefined
  const tokenSessionId =
    typeof token.sessionId === 'string' && token.sessionId.length > 0
      ? token.sessionId
      : undefined

  const tokenUserId =
    typeof token.userId === 'string' && token.userId.length > 0
      ? token.userId
      : typeof token.sub === 'string' && token.sub.length > 0
        ? token.sub
        : undefined

  if (tokenUserId) {
    if (!tokenSessionId) {
      // Tokens legados sem sessionId nao podem ser validados contra sessao ativa.
      // Rejeitar para forcar re-autenticacao com token atualizado.
      return {}
    }

    const activeSession = await isActiveUserSession({
      userId: tokenUserId,
      sessionId: tokenSessionId,
    })

    if (!activeSession) {
      return {}
    }

    return { userId: tokenUserId, role }
  }

  const username = typeof token.username === 'string' ? token.username : undefined
  const email = typeof token.email === 'string' ? token.email : undefined

  if (!username && !email) return {}
  if (!tokenSessionId) return {}

  const fallbackUser = await prisma.user.findFirst({
    where: {
      activeSessionId: tokenSessionId,
      OR: [
        username ? { username } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as Array<{ username?: string; email?: string }>,
    },
    select: { id: true, role: true },
  })

  if (!fallbackUser) return {}

  return {
    userId: fallbackUser.id,
    role: fallbackUser.role ?? role,
  }
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string | undefined> {
  const { userId } = await getAuthIdentityFromRequest(req)
  return userId
}
