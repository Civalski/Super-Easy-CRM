import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function getUserIdFromRequest(req: NextRequest): Promise<string | undefined> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return undefined

  const candidateIds = [token.userId, token.sub].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  )

  for (const candidateId of candidateIds) {
    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { id: true },
    })
    if (user) {
      return user.id
    }
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
