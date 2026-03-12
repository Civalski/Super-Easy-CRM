import { prisma } from '@/lib/prisma'

export type TokenIdentity = {
  userId?: string
  sessionId?: string
}

const ACTIVE_SESSION_CACHE_TTL_MS = 2_000
const ACTIVE_SESSION_CACHE_MAX_ENTRIES = 1_000

type ActiveSessionCacheEntry = {
  activeSessionId: string | null
  expiresAt: number
}

const activeSessionCache = new Map<string, ActiveSessionCacheEntry>()

function pruneActiveSessionCache(now: number) {
  activeSessionCache.forEach((entry, userId) => {
    if (entry.expiresAt <= now) {
      activeSessionCache.delete(userId)
    }
  })

  if (activeSessionCache.size <= ACTIVE_SESSION_CACHE_MAX_ENTRIES) {
    return
  }

  const overflow = activeSessionCache.size - ACTIVE_SESSION_CACHE_MAX_ENTRIES
  let removed = 0

  for (const userId of Array.from(activeSessionCache.keys())) {
    activeSessionCache.delete(userId)
    removed += 1
    if (removed >= overflow) break
  }
}

export async function isActiveUserSession(identity: TokenIdentity): Promise<boolean> {
  const userId = identity.userId?.trim()
  const sessionId = identity.sessionId?.trim()

  if (!userId || !sessionId) {
    return false
  }

  const now = Date.now()
  const cached = activeSessionCache.get(userId)

  if (cached && cached.expiresAt > now) {
    return !!cached.activeSessionId && cached.activeSessionId === sessionId
  }

  if (activeSessionCache.size > ACTIVE_SESSION_CACHE_MAX_ENTRIES) {
    pruneActiveSessionCache(now)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeSessionId: true },
  })

  activeSessionCache.set(userId, {
    activeSessionId: user?.activeSessionId ?? null,
    expiresAt: now + ACTIVE_SESSION_CACHE_TTL_MS,
  })

  return !!user?.activeSessionId && user.activeSessionId === sessionId
}
