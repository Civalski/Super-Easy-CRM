import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import {
  mapStripeStatusToNormalized,
  getSubscriptionNextBillingAt,
  syncUserSubscriptionFromCheckoutSession,
} from '@/lib/billing/stripe-subscription-sync'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!sig || !webhookSecret || !secretKey) {
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 })
  }

  const { stripe } = await import('@/lib/billing/stripe')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      await syncUserSubscriptionFromCheckoutSession(session)
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const user = await prisma.user.findFirst({
        where: { subscriptionExternalId: sub.id },
      })
      if (user) {
        const status = mapStripeStatusToNormalized(sub.status)
        const nextBillingAt = getSubscriptionNextBillingAt(sub)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: status,
            subscriptionNextBillingAt: nextBillingAt,
            subscriptionLastWebhookAt: new Date(),
          },
        })
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] Erro ao processar evento:', event.type, err)
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
