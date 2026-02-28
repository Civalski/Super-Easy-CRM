import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function getUserIdFromRequest(req: NextRequest): Promise<string | undefined> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return undefined

  // Fast path: avoid a DB lookup on every authenticated request.
  if (typeof token.userId === 'string' && token.userId.length > 0) {
    return token.userId
  }
  if (typeof token.sub === 'string' && token.sub.length > 0) {
    return token.sub
  }

  const username = typeof token.username === 'string' ? token.username : undefined
  const email = typeof token.email === 'string' ? token.email : undefined

  if (!username && !email) return undefined

  const fallbackUser = await prisma.user.findFirst({
    where: {
      OR: [
        username ? { username } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) as Array<{ username?: string; email?: string }>,
    },
    select: { id: true },
  })

  return fallbackUser?.id
}
