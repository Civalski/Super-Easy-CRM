import { prisma } from '@/lib/prisma'
import {
  resolveSubscriptionState,
} from '@/lib/billing/subscription'
import { isSubscriptionSchemaMissingError } from '@/lib/billing/subscription-schema'
import { isBillingSubscriptionDisabledServer } from '@/lib/billing/feature-toggle'

function isAdminRole(role: string | null | undefined) {
  return (role ?? '').trim().toLowerCase() === 'admin'
}

export async function getUserSubscriptionAccess(userId: string) {
  if (isBillingSubscriptionDisabledServer()) {
    return {
      exists: false,
      schemaReady: true,
      status: 'authorized',
      active: true,
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        subscriptionNextBillingAt: true,
        subscriptionStatus: true,
        subscriptionProvider: true,
      },
    })

    if (!user) {
      return {
        exists: false,
        schemaReady: true,
        status: 'inactive',
        active: false,
      }
    }

    if (isAdminRole(user.role)) {
      return {
        exists: true,
        schemaReady: true,
        provider: user.subscriptionProvider,
        expired: false,
        status: 'authorized',
        active: true,
      }
    }

    const state = resolveSubscriptionState({
      nextBillingAt: user.subscriptionNextBillingAt,
      provider: user.subscriptionProvider,
      status: user.subscriptionStatus,
    })

    return {
      exists: true,
      schemaReady: true,
      provider: user.subscriptionProvider,
      expired: state.expired,
      status: state.status,
      active: state.active,
    }
  } catch (error) {
    if (isSubscriptionSchemaMissingError(error)) {
      return {
        exists: true,
        schemaReady: false,
        status: 'inactive',
        active: false,
      }
    }
    throw error
  }
}
