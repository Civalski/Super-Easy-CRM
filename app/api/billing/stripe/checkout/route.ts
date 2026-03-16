import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'
import {
  billingSubscriptionDisabledResponse,
  isBillingSubscriptionDisabledServer,
} from '@/lib/billing/feature-toggle'

export const dynamic = 'force-dynamic'

function parseTrialDays(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value)) return 0
  if (value <= 0 || value > 30) return 0
  return value
}

function resolveRequestedPriceId(planId: string | null) {
  const PLAN_ENV_KEYS: Record<string, string> = {
    plan_1: 'STRIPE_PRICE_ID_PLAN_1',
    plan_3: 'STRIPE_PRICE_ID_PLAN_3',
    plan_5: 'STRIPE_PRICE_ID_PLAN_5',
    plan_10: 'STRIPE_PRICE_ID_PLAN_10_PLUS',
    plan_10_plus: 'STRIPE_PRICE_ID_PLAN_10_PLUS',
  }

  if (!planId) return null
  if (planId.startsWith('price_')) return planId

  const envKey = PLAN_ENV_KEYS[planId]
  return envKey ? process.env[envKey] ?? null : null
}

export async function POST(request: NextRequest) {
  if (isBillingSubscriptionDisabledServer()) {
    return billingSubscriptionDisabledResponse()
  }

  const body = await request.json().catch(() => ({}))
  const requestedPlanId = typeof body.planId === 'string' ? body.planId : null
  const trialDays = parseTrialDays(body.trialDays)

  return withAuth(request, async (userId) => {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        {
          error: 'Stripe nao configurado. Configure STRIPE_SECRET_KEY.',
        },
        { status: 503 }
      )
    }

    const { stripe } = await import('@/lib/billing/stripe')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        subscriptionPlanCode: true,
      },
    })

    const priceId =
      resolveRequestedPriceId(requestedPlanId) ??
      user?.subscriptionPlanCode ??
      process.env.STRIPE_PRICE_ID_PLAN_1 ??
      process.env.STRIPE_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            'Plano nao configurado. Configure STRIPE_PRICE_ID_PLAN_* no .env ou salve um plano no cadastro.',
        },
        { status: 503 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard?subscription=success`
    const cancelUrl = `${baseUrl}/dashboard?subscription=canceled`

    try {
      let customerId: string
      if (user?.email) {
        const existing = await stripe.customers.list({
          email: user.email,
          limit: 1,
        })
        if (existing.data.length > 0) {
          customerId = existing.data[0].id
        } else {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId },
          })
          customerId = customer.id
        }
      } else {
        const customer = await stripe.customers.create({
          metadata: { userId },
        })
        customerId = customer.id
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        customer: customerId,
        payment_method_collection: 'always',
        ...(trialDays > 0
          ? {
              subscription_data: {
                trial_period_days: trialDays,
                metadata: { userId },
              },
            }
          : {
              subscription_data: {
                metadata: { userId },
              },
            }),
      })

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionProvider: 'stripe',
          subscriptionStatus: 'pending',
          subscriptionPlanCode: priceId,
          subscriptionCheckoutUrl: session.url,
        },
      })

      if (!session.url) {
        throw new Error('Checkout sem URL')
      }

      return NextResponse.json({ url: session.url })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao criar sessao Stripe'
      console.error('[checkout] Stripe error:', err)
      return NextResponse.json(
        {
          error: 'Falha ao criar sessao de checkout',
          details: message,
        },
        { status: 500 }
      )
    }
  })
}
