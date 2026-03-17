import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import {
  resolveSubscriptionState,
} from '@/lib/billing/subscription'
import { isSubscriptionSchemaMissingError } from '@/lib/billing/subscription-schema'
import {
  billingSubscriptionDisabledResponse,
  isBillingSubscriptionDisabledServer,
} from '@/lib/billing/feature-toggle'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isAdminRole(role: string | null | undefined) {
  return (role ?? '').trim().toLowerCase() === 'admin'
}

function subscriptionSchemaMissingResponse() {
  return NextResponse.json(
    {
      error:
        'Banco sem colunas de assinatura. Execute a migracao do Prisma e reinicie o servidor.',
      code: 'SUBSCRIPTION_SCHEMA_MISSING',
    },
    { status: 503 }
  )
}

function toClientSubscriptionPayload(user: {
  role: string | null
  subscriptionProvider: string | null
  subscriptionStatus: string
  subscriptionExternalId: string | null
  subscriptionPlanCode: string | null
  subscriptionCheckoutUrl: string | null
  subscriptionNextBillingAt: Date | null
  subscriptionLastWebhookAt: Date | null
}) {
  if (isAdminRole(user.role)) {
    return {
      provider: user.subscriptionProvider,
      status: 'authorized',
      active: true,
      expired: false,
      subscriptionId: user.subscriptionExternalId,
      planCode: user.subscriptionPlanCode,
      checkoutUrl: user.subscriptionCheckoutUrl,
      nextBillingAt: user.subscriptionNextBillingAt?.toISOString() ?? null,
      lastWebhookAt: user.subscriptionLastWebhookAt?.toISOString() ?? null,
    }
  }

  const state = resolveSubscriptionState({
    nextBillingAt: user.subscriptionNextBillingAt,
    provider: user.subscriptionProvider,
    status: user.subscriptionStatus,
  })

  return {
    provider: user.subscriptionProvider,
    status: state.status,
    active: state.active,
    expired: state.expired,
    subscriptionId: user.subscriptionExternalId,
    planCode: user.subscriptionPlanCode,
    checkoutUrl: user.subscriptionCheckoutUrl,
    nextBillingAt: user.subscriptionNextBillingAt?.toISOString() ?? null,
    lastWebhookAt: user.subscriptionLastWebhookAt?.toISOString() ?? null,
  }
}

export async function GET(request: NextRequest) {
  if (isBillingSubscriptionDisabledServer()) {
    return billingSubscriptionDisabledResponse()
  }

  return withAuth(request, async (userId) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          subscriptionProvider: true,
          subscriptionStatus: true,
          subscriptionExternalId: true,
          subscriptionPlanCode: true,
          subscriptionCheckoutUrl: true,
          subscriptionNextBillingAt: true,
          subscriptionLastWebhookAt: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
      }

      return NextResponse.json(toClientSubscriptionPayload(user))
    } catch (error) {
      if (isSubscriptionSchemaMissingError(error)) {
        return subscriptionSchemaMissingResponse()
      }
      console.error('Erro ao obter assinatura:', error)
      return NextResponse.json(
        { error: 'Erro ao obter assinatura' },
        { status: 500 }
      )
    }
  })
}
