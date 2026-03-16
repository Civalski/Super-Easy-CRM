import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export function mapStripeStatusToNormalized(status: string): string {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled' || status === 'cancelled' || status === 'unpaid') return 'cancelled'
  if (status === 'past_due' || status === 'incomplete') return 'pending'
  return 'inactive'
}

export function getSubscriptionNextBillingAt(sub: Stripe.Subscription): Date | null {
  const periodEnds = sub.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => Number.isFinite(value))

  if (!periodEnds.length) return null

  return new Date(Math.max(...periodEnds) * 1000)
}

export async function syncUserSubscriptionFromStripeSubscription(params: {
  userId: string
  subscription: Stripe.Subscription
}) {
  const { userId, subscription } = params
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const status = mapStripeStatusToNormalized(subscription.status)
  const nextBillingAt = getSubscriptionNextBillingAt(subscription)

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionProvider: 'stripe',
      subscriptionExternalId: subscription.id,
      subscriptionStatus: status,
      subscriptionPlanCode: priceId,
      subscriptionCheckoutUrl: null,
      subscriptionNextBillingAt: nextBillingAt,
      subscriptionLastWebhookAt: new Date(),
    },
  })
}

export async function syncUserSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const userId = session.client_reference_id
  if (!userId || !session.subscription) return false

  const { stripe } = await import('@/lib/billing/stripe')
  const subscription =
    typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription

  await syncUserSubscriptionFromStripeSubscription({
    userId,
    subscription,
  })

  return true
}
