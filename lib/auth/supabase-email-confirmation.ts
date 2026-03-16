import 'server-only'
import { prisma } from '@/lib/prisma'

export const EMAIL_CONFIRMATION_PROVIDER = 'supabase'
export const EMAIL_CONFIRMATION_TRIAL_DAYS = 7

type PendingRegistrationUser = {
  subscriptionProvider: string | null
  subscriptionStatus: string
  subscriptionExternalId: string | null
}

export function isRecoverablePendingRegisterUser(user: PendingRegistrationUser) {
  const provider = user.subscriptionProvider?.trim().toLowerCase() ?? null
  const status = user.subscriptionStatus.trim().toLowerCase()

  if (provider === EMAIL_CONFIRMATION_PROVIDER) {
    return status === 'pending'
  }

  return provider === 'stripe' && status === 'pending' && !user.subscriptionExternalId
}

export function getEmailConfirmationTrialEndsAt(baseDate = new Date()) {
  const trialEndsAt = new Date(baseDate)
  trialEndsAt.setDate(trialEndsAt.getDate() + EMAIL_CONFIRMATION_TRIAL_DAYS)
  return trialEndsAt
}

export async function activateSupabaseTrialByEmail(params: {
  email: string
  supabaseUserId: string
}) {
  const normalizedEmail = params.email.trim().toLowerCase()
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      subscriptionNextBillingAt: true,
      subscriptionProvider: true,
      subscriptionStatus: true,
    },
  })

  if (!existingUser) {
    return null
  }

  const now = new Date()
  const activeTrialEndsAt =
    existingUser.subscriptionProvider === EMAIL_CONFIRMATION_PROVIDER &&
    existingUser.subscriptionStatus === 'active' &&
    existingUser.subscriptionNextBillingAt &&
    existingUser.subscriptionNextBillingAt.getTime() > now.getTime()
      ? existingUser.subscriptionNextBillingAt
      : getEmailConfirmationTrialEndsAt(now)

  return prisma.user.update({
    where: { id: existingUser.id },
    data: {
      subscriptionCheckoutUrl: null,
      subscriptionExternalId: params.supabaseUserId,
      subscriptionLastWebhookAt: now,
      subscriptionNextBillingAt: activeTrialEndsAt,
      subscriptionProvider: EMAIL_CONFIRMATION_PROVIDER,
      subscriptionStatus: 'active',
    },
    select: {
      id: true,
      email: true,
      subscriptionNextBillingAt: true,
    },
  })
}
