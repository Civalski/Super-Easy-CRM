import { prisma } from '@/lib/prisma'

export type TokenIdentity = {
  userId?: string
  sessionId?: string
}

export async function isActiveUserSession(identity: TokenIdentity): Promise<boolean> {
  const userId = identity.userId?.trim()
  const sessionId = identity.sessionId?.trim()

  if (!userId || !sessionId) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeSessionId: true },
  })

  return !!user?.activeSessionId && user.activeSessionId === sessionId
}
