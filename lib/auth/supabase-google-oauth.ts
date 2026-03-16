import 'server-only'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import {
  EMAIL_CONFIRMATION_PROVIDER,
  getEmailConfirmationTrialEndsAt,
} from '@/lib/auth/supabase-email-confirmation'

function deriveUsernameFromEmail(email: string): string {
  const base = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'user'
  return base.slice(0, 30)
}

function generateUniqueUsername(base: string): string {
  const suffix = randomUUID().slice(0, 8)
  return `${base}_${suffix}`
}

export async function findOrCreateUserFromGoogleOAuth(params: {
  email: string
  name: string | null
  supabaseUserId: string
}) {
  const normalizedEmail = params.email.trim().toLowerCase()
  if (!normalizedEmail) return null

  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, subscriptionProvider: true, subscriptionStatus: true },
  })

  const existingBySupabaseId = await prisma.user.findFirst({
    where: { subscriptionExternalId: params.supabaseUserId },
    select: { id: true },
  })

  const existingUser = existingByEmail ?? existingBySupabaseId
  if (existingUser) {
    const now = new Date()
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        subscriptionExternalId: params.supabaseUserId,
        subscriptionProvider: EMAIL_CONFIRMATION_PROVIDER,
        subscriptionStatus: 'active',
        subscriptionLastWebhookAt: now,
        subscriptionNextBillingAt: getEmailConfirmationTrialEndsAt(now),
        name: params.name ?? undefined,
      },
    })
    return existingUser.id
  }

  let username = deriveUsernameFromEmail(normalizedEmail)
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  })
  if (existingUsername) {
    username = generateUniqueUsername(deriveUsernameFromEmail(normalizedEmail))
  }

  const oauthPlaceholderHash = await bcrypt.hash(
    `oauth-google-${randomUUID()}:${params.supabaseUserId}`,
    10
  )

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: params.name?.trim() || null,
      username,
      passwordHash: oauthPlaceholderHash,
      role: 'user',
      subscriptionProvider: EMAIL_CONFIRMATION_PROVIDER,
      subscriptionExternalId: params.supabaseUserId,
      subscriptionStatus: 'active',
      subscriptionNextBillingAt: getEmailConfirmationTrialEndsAt(),
    },
    select: { id: true },
  })

  return newUser.id
}
