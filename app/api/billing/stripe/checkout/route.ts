import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import { prisma } from '@/lib/prisma'
import {
  isBillingSubscriptionDisabledServer,
  billingSubscriptionDisabledResponse,
} from '@/lib/billing/feature-toggle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (isBillingSubscriptionDisabledServer()) {
    return billingSubscriptionDisabledResponse()
  }

  const body = await request.json().catch(() => ({}))
  const planId = typeof body.planId === 'string' ? body.planId : null

  const PLAN_ENV_KEYS: Record<string, string> = {
    plan_1: 'STRIPE_PRICE_ID_PLAN_1',
    plan_5: 'STRIPE_PRICE_ID_PLAN_5',
    plan_10_plus: 'STRIPE_PRICE_ID_PLAN_10_PLUS',
  }
  const envKey = planId ? PLAN_ENV_KEYS[planId] : null
  const planPriceId = envKey ? process.env[envKey] : null
  const priceId = planPriceId ?? process.env.STRIPE_PRICE_ID

  return withAuth(request, async (userId) => {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey || !priceId) {
      return NextResponse.json(
        {
          error: planId
            ? 'Plano não configurado. Configure as variáveis STRIPE_PRICE_ID_PLAN_* no .env.'
            : 'Stripe não configurado. Configure STRIPE_SECRET_KEY e STRIPE_PRICE_ID.',
        },
        { status: 503 }
      )
    }

    const { stripe } = await import('@/lib/billing/stripe')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard?subscription=success`
    const cancelUrl = `${baseUrl}/dashboard?subscription=canceled`

    try {
      // Accounts V2 em testmode exige customer existente. Buscamos ou criamos.
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
      })

      return NextResponse.json({ url: session.url })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido ao criar sessão Stripe'
      console.error('[checkout] Stripe error:', err)
      return NextResponse.json(
        {
          error: 'Falha ao criar sessão de checkout',
          details: message,
        },
        { status: 500 }
      )
    }
  })
}
