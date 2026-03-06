import { prisma } from '@/lib/prisma'
import { isMercadoPagoStatusActive, normalizeMercadoPagoStatus } from '@/lib/billing/mercado-pago'
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

    const status = normalizeMercadoPagoStatus(user.subscriptionStatus)

    return {
      exists: true,
      schemaReady: true,
      provider: user.subscriptionProvider,
      status,
      active: isMercadoPagoStatusActive(status),
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
