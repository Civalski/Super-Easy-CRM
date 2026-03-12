import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function mapStripeStatusToNormalized(status: string): string {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled' || status === 'cancelled' || status === 'unpaid') return 'cancelled'
  if (status === 'past_due' || status === 'incomplete') return 'pending'
  return 'inactive'
}

function getSubscriptionNextBillingAt(sub: Stripe.Subscription): Date | null {
  const periodEnds = sub.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => Number.isFinite(value))

  if (!periodEnds.length) return null

  return new Date(Math.max(...periodEnds) * 1000)
}

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    if (userId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const status = mapStripeStatusToNormalized(sub.status)
      const priceId = sub.items.data[0]?.price?.id ?? null
      const nextBillingAt = getSubscriptionNextBillingAt(sub)
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionProvider: 'stripe',
          subscriptionExternalId: sub.id,
          subscriptionStatus: status,
          subscriptionPlanCode: priceId,
          subscriptionCheckoutUrl: null,
          subscriptionNextBillingAt: nextBillingAt,
          subscriptionLastWebhookAt: new Date(),
        },
      })
    }
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

  return NextResponse.json({ received: true })
}
