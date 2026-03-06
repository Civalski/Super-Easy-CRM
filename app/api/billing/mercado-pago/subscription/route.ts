import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/route-helpers'
import {
  createMercadoPagoSubscription,
  getMercadoPagoSubscription,
  getMercadoPagoSubscriptionSettings,
  isMercadoPagoStatusActive,
  normalizeMercadoPagoStatus,
} from '@/lib/billing/mercado-pago'
import { isSubscriptionSchemaMissingError } from '@/lib/billing/subscription-schema'
import {
  billingSubscriptionDisabledResponse,
  isBillingSubscriptionDisabledServer,
} from '@/lib/billing/feature-toggle'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const TEST_COUPON_PLAN_CODE = 'coupon-100-test'

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

function getTestCouponCode() {
  return process.env.MERCADOPAGO_TEST_COUPON_100?.trim() || ''
}

function parseDate(value: string | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function toClientSubscriptionPayload(user: {
  subscriptionProvider: string | null
  subscriptionStatus: string
  subscriptionExternalId: string | null
  subscriptionPlanCode: string | null
  subscriptionCheckoutUrl: string | null
  subscriptionNextBillingAt: Date | null
  subscriptionLastWebhookAt: Date | null
}) {
  const settings = getMercadoPagoSubscriptionSettings()

  return {
    provider: user.subscriptionProvider,
    status: normalizeMercadoPagoStatus(user.subscriptionStatus),
    active: isMercadoPagoStatusActive(user.subscriptionStatus),
    subscriptionId: user.subscriptionExternalId,
    planCode: user.subscriptionPlanCode,
    checkoutUrl: user.subscriptionCheckoutUrl,
    nextBillingAt: user.subscriptionNextBillingAt?.toISOString() ?? null,
    lastWebhookAt: user.subscriptionLastWebhookAt?.toISOString() ?? null,
    amount: settings.amount,
    currencyId: settings.currencyId,
    frequency: settings.frequency,
    frequencyType: settings.frequencyType,
    reason: settings.reason,
  }
}

async function syncSubscriptionIfPossible(userId: string, subscriptionId: string) {
  const subscription = await getMercadoPagoSubscription(subscriptionId)
  const normalizedStatus = normalizeMercadoPagoStatus(subscription.status)

  return prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionProvider: 'mercado_pago',
      subscriptionExternalId: subscription.id,
      subscriptionStatus: normalizedStatus,
      subscriptionPlanCode: subscription.preapproval_plan_id ?? null,
      subscriptionCheckoutUrl: subscription.init_point ?? null,
      subscriptionNextBillingAt: parseDate(subscription.next_payment_date),
      subscriptionLastWebhookAt: new Date(),
    },
    select: {
      subscriptionProvider: true,
      subscriptionStatus: true,
      subscriptionExternalId: true,
      subscriptionPlanCode: true,
      subscriptionCheckoutUrl: true,
      subscriptionNextBillingAt: true,
      subscriptionLastWebhookAt: true,
    },
  })
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

      const shouldSync = ['1', 'true', 'yes'].includes(
        request.nextUrl.searchParams.get('sync')?.toLowerCase() ?? ''
      )

      if (!shouldSync || !user.subscriptionExternalId) {
        return NextResponse.json(toClientSubscriptionPayload(user))
      }

      try {
        const refreshed = await syncSubscriptionIfPossible(
          userId,
          user.subscriptionExternalId
        )
        return NextResponse.json({
          ...toClientSubscriptionPayload(refreshed),
          synced: true,
        })
      } catch (syncError) {
        console.error('Erro ao sincronizar assinatura Mercado Pago:', syncError)
        return NextResponse.json({
          ...toClientSubscriptionPayload(user),
          synced: false,
        })
      }
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

export async function POST(request: NextRequest) {
  if (isBillingSubscriptionDisabledServer()) {
    return billingSubscriptionDisabledResponse()
  }

  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => ({}))
      const requestedCouponCode =
      body && typeof body === 'object' && 'couponCode' in body
        ? String((body as { couponCode?: unknown }).couponCode || '').trim()
        : ''

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionProvider: true,
        subscriptionStatus: true,
        subscriptionExternalId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    if (!user.email) {
      return NextResponse.json(
        {
          error:
            'Usuario sem e-mail cadastrado. Cadastre um e-mail para iniciar a assinatura.',
        },
        { status: 400 }
      )
    }

    if (isMercadoPagoStatusActive(user.subscriptionStatus)) {
      return NextResponse.json(
        {
          error: 'Assinatura ja esta ativa.',
        },
        { status: 409 }
      )
    }

    const configuredTestCoupon = getTestCouponCode()
    if (
      configuredTestCoupon &&
      requestedCouponCode &&
      requestedCouponCode.toLowerCase() === configuredTestCoupon.toLowerCase()
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionProvider: 'mercado_pago',
          subscriptionExternalId: null,
          subscriptionStatus: 'authorized',
          subscriptionPlanCode: TEST_COUPON_PLAN_CODE,
          subscriptionCheckoutUrl: null,
          subscriptionNextBillingAt: null,
          subscriptionLastWebhookAt: new Date(),
        },
      })

      return NextResponse.json({
        active: true,
        status: 'authorized',
        couponApplied: true,
      })
    }

    if (user.subscriptionExternalId) {
      try {
        const existing = await getMercadoPagoSubscription(user.subscriptionExternalId)
        const existingStatus = normalizeMercadoPagoStatus(existing.status)
        if (existingStatus === 'pending' && existing.init_point) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionProvider: 'mercado_pago',
              subscriptionStatus: existingStatus,
              subscriptionCheckoutUrl: existing.init_point,
              subscriptionPlanCode: existing.preapproval_plan_id ?? null,
              subscriptionNextBillingAt: parseDate(existing.next_payment_date),
            },
          })

          return NextResponse.json({
            checkoutUrl: existing.init_point,
            reused: true,
            status: existingStatus,
          })
        }
      } catch (existingError) {
        console.error('Falha ao verificar assinatura existente no Mercado Pago:', existingError)
      }
    }

    const createdSubscription = await createMercadoPagoSubscription({
      payerEmail: user.email,
      externalReference: user.id,
    })

    const normalizedStatus = normalizeMercadoPagoStatus(createdSubscription.status)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionProvider: 'mercado_pago',
        subscriptionExternalId: createdSubscription.id,
        subscriptionStatus: normalizedStatus,
        subscriptionPlanCode: createdSubscription.preapproval_plan_id ?? null,
        subscriptionCheckoutUrl: createdSubscription.init_point ?? null,
        subscriptionNextBillingAt: parseDate(createdSubscription.next_payment_date),
      },
    })

      return NextResponse.json({
        checkoutUrl: createdSubscription.init_point ?? null,
        subscriptionId: createdSubscription.id,
        status: normalizedStatus,
        active: isMercadoPagoStatusActive(normalizedStatus),
      })
    } catch (error) {
      if (isSubscriptionSchemaMissingError(error)) {
        return subscriptionSchemaMissingResponse()
      }
      console.error('Erro ao criar assinatura Mercado Pago:', error)
      return NextResponse.json(
        { error: 'Erro ao criar assinatura' },
        { status: 500 }
      )
    }
  })
}
