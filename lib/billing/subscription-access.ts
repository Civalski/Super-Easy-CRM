import { prisma } from '@/lib/prisma'
import {
  resolveSubscriptionState,
} from '@/lib/billing/subscription'
import { isSubscriptionSchemaMissingError } from '@/lib/billing/subscription-schema'
import { isBillingSubscriptionDisabledServer } from '@/lib/billing/feature-toggle'

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
