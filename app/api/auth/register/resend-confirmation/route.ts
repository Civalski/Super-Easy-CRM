import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendConfirmationEmail } from '@/lib/auth/send-confirmation-email'
import { buildEmailConfirmationLink } from '@/lib/auth/email-confirmation-link'
import { extractClientIpFromRequest } from '@/lib/security/client-ip'
import {
  consumeRateLimit,
  resendConfirmationRateLimitConfig,
} from '@/lib/security/rate-limit'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import {
  EMAIL_CONFIRMATION_PROVIDER,
  isRecoverablePendingRegisterUser,
} from '@/lib/auth/supabase-email-confirmation'
import {
  createSupabaseAdminClient,
  getRequestOrigin,
  getSupabaseEmailRedirectTo,
} from '@/lib/supabase/server'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const clientIp = extractClientIpFromRequest(request)
    const email =
      typeof body.email === 'string' && body.email.trim() !== ''
        ? body.email.trim().toLowerCase()
        : ''
    const honeypot = typeof body.website === 'string' ? body.website.trim() : ''
    const turnstileToken =
      typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : ''

    const ipRateKey = `auth:resend-confirmation:ip:${clientIp}`
    const emailRateKey = email ? `auth:resend-confirmation:email:${email}` : ''

    const ipRateLimit = consumeRateLimit(ipRateKey, resendConfirmationRateLimitConfig)
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas. Tente novamente em ${Math.ceil(
            ipRateLimit.retryAfterSec / 60
          )} minuto(s).`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ipRateLimit.retryAfterSec),
          },
        }
      )
    }

    if (honeypot.length > 0) {
      console.warn('Reenvio de confirmacao rejeitado por honeypot', { clientIp })
      return NextResponse.json({ error: 'Requisicao invalida' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
    }

    if (emailRateKey) {
      const emailRateLimit = consumeRateLimit(emailRateKey, resendConfirmationRateLimitConfig)
      if (!emailRateLimit.allowed) {
        return NextResponse.json(
          {
            error: `Muitas tentativas para este email. Tente novamente em ${Math.ceil(
              emailRateLimit.retryAfterSec / 60
            )} minuto(s).`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(emailRateLimit.retryAfterSec),
            },
          }
        )
      }
    }

    const turnstileResult = await verifyTurnstileToken({
      expectedAction: 'resend_confirmation',
      token: turnstileToken,
      remoteIp: clientIp,
    })
    if (!turnstileResult.success) {
      console.warn('Reenvio de confirmacao rejeitado por Turnstile', {
        clientIp,
        email,
        errors: turnstileResult.errorCodes,
      })
      return NextResponse.json(
        { error: 'Falha na verificacao anti-bot' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        name: true,
        email: true,
        subscriptionExternalId: true,
        subscriptionProvider: true,
        subscriptionStatus: true,
      },
    })

    if (
      !user ||
      user.subscriptionProvider !== EMAIL_CONFIRMATION_PROVIDER ||
      !isRecoverablePendingRegisterUser(user)
    ) {
      return NextResponse.json({ success: true })
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const origin = getRequestOrigin(request) ?? new URL(request.url).origin
    const emailRedirectTo = getSupabaseEmailRedirectTo(origin)
    if (!supabaseAdmin || !process.env.RESEND_API_KEY?.trim()) {
      return NextResponse.json(
        { error: 'Configuracao de email indisponivel.' },
        { status: 503 }
      )
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: emailRedirectTo,
        },
      })

    if (linkError) {
      console.error('Erro ao gerar link manual de confirmacao:', linkError)
      return NextResponse.json(
        { error: 'Nao foi possivel reenviar o email agora.' },
        { status: 502 }
      )
    }

    const generatedTokenHash = linkData?.properties?.hashed_token ?? null
    const generatedType = linkData?.properties?.verification_type ?? null
    if (!generatedTokenHash || !generatedType) {
      console.error('Supabase generateLink sem hashed_token/verification_type no reenvio')
      return NextResponse.json(
        { error: 'Nao foi possivel reenviar o email agora.' },
        { status: 502 }
      )
    }

    const sendResult = await sendConfirmationEmail({
      to: email,
      nome: user.name ?? undefined,
      actionLink: buildEmailConfirmationLink({
        redirectTo: emailRedirectTo,
        tokenHash: generatedTokenHash,
        type: generatedType,
      }),
    })
    if (!sendResult.ok) {
      console.error('Erro ao reenviar email via Resend:', sendResult.error)
      return NextResponse.json(
        { error: 'Nao foi possivel reenviar o email agora.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao reenviar confirmacao de email:', error)
    return NextResponse.json(
      { error: 'Erro ao reenviar confirmacao de email' },
      { status: 500 }
    )
  }
}
