import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildResetPasswordLink } from '@/lib/auth/reset-password-link'
import { sendResetPasswordEmail } from '@/lib/auth/send-reset-password-email'
import { extractClientIpFromRequest } from '@/lib/security/client-ip'
import { consumeRateLimit, forgotPasswordRateLimitConfig } from '@/lib/security/rate-limit'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import {
  createSupabaseAdminClient,
  getRequestOrigin,
  getSupabaseResetPasswordRedirectTo,
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

    const ipRateKey = `auth:forgot-password:ip:${clientIp}`
    const emailRateKey = email ? `auth:forgot-password:email:${email}` : ''

    const ipRateLimit = consumeRateLimit(ipRateKey, forgotPasswordRateLimitConfig)
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
      console.warn('Reset de senha rejeitado por honeypot', { clientIp })
      return NextResponse.json({ error: 'Requisicao invalida' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
    }

    if (emailRateKey) {
      const emailRateLimit = consumeRateLimit(emailRateKey, forgotPasswordRateLimitConfig)
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
      expectedAction: 'forgot_password',
      token: turnstileToken,
      remoteIp: clientIp,
    })
    if (!turnstileResult.success) {
      console.warn('Reset de senha rejeitado por Turnstile', {
        clientIp,
        email,
        errors: turnstileResult.errorCodes,
      })
      return NextResponse.json(
        { error: 'Falha na verificacao anti-bot' },
        { status: 400 }
      )
    }

    const origin = getRequestOrigin(request) ?? new URL(request.url).origin
    const redirectTo = getSupabaseResetPasswordRedirectTo(origin)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        name: true,
        subscriptionProvider: true,
      },
    })

    if (!user || user.subscriptionProvider !== 'supabase') {
      return NextResponse.json({ success: true })
    }

    const supabaseAdmin = createSupabaseAdminClient()
    if (!supabaseAdmin || !process.env.RESEND_API_KEY?.trim()) {
      return NextResponse.json(
        { error: 'Configuracao de email indisponivel.' },
        { status: 503 }
      )
    }

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo,
        },
      })

    if (linkError) {
      console.error('Erro ao gerar link de recuperacao:', linkError)
      return NextResponse.json(
        { error: 'Nao foi possivel enviar o email. Tente novamente.' },
        { status: 502 }
      )
    }

    const tokenHash = linkData?.properties?.hashed_token ?? null
    const verificationType = linkData?.properties?.verification_type ?? null
    if (!tokenHash || !verificationType) {
      console.error('Supabase generateLink sem hashed_token/verification_type (recovery)')
      return NextResponse.json(
        { error: 'Nao foi possivel enviar o email. Tente novamente.' },
        { status: 502 }
      )
    }

    const sendResult = await sendResetPasswordEmail({
      to: email,
      nome: user?.name?.trim() || undefined,
      actionLink: buildResetPasswordLink({
        redirectTo,
        tokenHash,
        type: verificationType,
      }),
    })

    if (!sendResult.ok) {
      console.error('Erro ao enviar email de redefinicao via Resend:', sendResult.error)
      return NextResponse.json(
        { error: 'Nao foi possivel enviar o email. Tente novamente.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao processar esqueci minha senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitacao.' },
      { status: 500 }
    )
  }
}
