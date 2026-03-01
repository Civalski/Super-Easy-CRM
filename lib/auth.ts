import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function getAuthIdentityFromRequest(req: NextRequest): Promise<{
  userId?: string
  role?: string
}> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return {}

  const role = typeof token.role === 'string' && token.role.length > 0 ? token.role : undefined

  // Fast path: avoid a DB lookup on every authenticated request.
  if (typeof token.userId === 'string' && token.userId.length > 0) {
    return { userId: token.userId, role }
  }
  if (typeof token.sub === 'string' && token.sub.length > 0) {
    return { userId: token.sub, role }
  }

  const username = typeof token.username === 'string' ? token.username : undefined
  const email = typeof token.email === 'string' ? token.email : undefined

  if (!username && !email) return { role }

  const fallbackUser = await prisma.user.findFirst({
    where: {
      OR: [
        username ? { username } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as Array<{ username?: string; email?: string }>,
    },
    select: { id: true, role: true },
  })

  if (!fallbackUser) {
    return { role }
  }

  return {
    userId: fallbackUser.id,
    role: fallbackUser.role ?? role,
  }
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string | undefined> {
  const { userId } = await getAuthIdentityFromRequest(req)
  return userId
}
