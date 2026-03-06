import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import {
  getMercadoPagoSubscription,
  getMercadoPagoSubscriptionSettings,
  normalizeMercadoPagoStatus,
  validateMercadoPagoWebhookSignature,
} from '@/lib/billing/mercado-pago'
import { isBillingSubscriptionDisabledServer } from '@/lib/billing/feature-toggle'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function parseDate(value: string | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function extractDataId(payload: Record<string, unknown>, request: NextRequest) {
  const queryDataId =
    request.nextUrl.searchParams.get('data.id') ||
    request.nextUrl.searchParams.get('id')

  if (queryDataId) return queryDataId

  const data = payload.data
  if (data && typeof data === 'object' && 'id' in data) {
    const bodyDataId = (data as { id?: unknown }).id
    if (typeof bodyDataId === 'string' && bodyDataId.trim()) {
      return bodyDataId
    }
    if (typeof bodyDataId === 'number') {
      return String(bodyDataId)
    }
  }

  if (typeof payload.id === 'string' && payload.id.trim()) {
    return payload.id
  }
  if (typeof payload.id === 'number') {
    return String(payload.id)
  }

  return null
}

function isSubscriptionTopic(payload: Record<string, unknown>, request: NextRequest) {
  const queryType = request.nextUrl.searchParams.get('type')?.toLowerCase()
  const queryTopic = request.nextUrl.searchParams.get('topic')?.toLowerCase()

  const bodyType =
    typeof payload.type === 'string' ? payload.type.toLowerCase() : undefined
  const bodyTopic =
    typeof payload.topic === 'string' ? payload.topic.toLowerCase() : undefined
  const bodyAction =
    typeof payload.action === 'string' ? payload.action.toLowerCase() : undefined

  const values = [queryType, queryTopic, bodyType, bodyTopic, bodyAction]

  return values.some((value) =>
    value
      ? value.includes('preapproval') || value.includes('subscription_preapproval')
      : false
  )
}

async function findUserIdForSubscription(subscription: {
  id: string
  external_reference?: string
  payer_email?: string
}) {
  const orFilters: Prisma.UserWhereInput[] = [{ subscriptionExternalId: subscription.id }]

  if (subscription.external_reference?.trim()) {
    orFilters.push({ id: subscription.external_reference.trim() })
  }

  if (subscription.payer_email?.trim()) {
    orFilters.push({ email: subscription.payer_email.trim().toLowerCase() })
  }

  const user = await prisma.user.findFirst({
    where: { OR: orFilters },
    select: { id: true },
  })

  return user?.id ?? null
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  if (isBillingSubscriptionDisabledServer()) {
    return NextResponse.json({ ok: true, ignored: 'billing_subscription_disabled' })
  }

  const bodyText = await request.text()
  let payload: Record<string, unknown> = {}

  if (bodyText) {
    try {
      payload = JSON.parse(bodyText) as Record<string, unknown>
    } catch (error) {
      console.warn('Webhook Mercado Pago com JSON invalido:', error)
    }
  }

  const dataId = extractDataId(payload, request)
  if (!dataId) {
    return NextResponse.json({ ok: true, ignored: 'missing_data_id' })
  }

  const settings = getMercadoPagoSubscriptionSettings()
  if (process.env.NODE_ENV === 'production' && !settings.webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret nao configurado' },
      { status: 500 }
    )
  }

  const signatureValidation = validateMercadoPagoWebhookSignature({
    headers: request.headers,
    dataId,
    webhookSecret: settings.webhookSecret,
  })

  if (!signatureValidation.valid) {
    return NextResponse.json({ error: 'Assinatura do webhook invalida' }, { status: 401 })
  }

  if (!isSubscriptionTopic(payload, request)) {
    return NextResponse.json({ ok: true, ignored: 'not_subscription_topic' })
  }

  try {
    const subscription = await getMercadoPagoSubscription(dataId)

    const userId = await findUserIdForSubscription({
      id: subscription.id,
      external_reference: subscription.external_reference,
      payer_email: subscription.payer_email,
    })

    if (!userId) {
      return NextResponse.json({ ok: true, ignored: 'user_not_found' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionProvider: 'mercado_pago',
        subscriptionExternalId: subscription.id,
        subscriptionStatus: normalizeMercadoPagoStatus(subscription.status),
        subscriptionPlanCode: subscription.preapproval_plan_id ?? null,
        subscriptionCheckoutUrl: subscription.init_point ?? null,
        subscriptionNextBillingAt: parseDate(subscription.next_payment_date),
        subscriptionLastWebhookAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao processar webhook Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook Mercado Pago' },
      { status: 500 }
    )
  }
}
