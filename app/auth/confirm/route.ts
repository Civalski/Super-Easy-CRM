import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createRegisterCompletionToken } from '@/lib/auth/register-completion-token'
import { activateSupabaseTrialByEmail } from '@/lib/auth/supabase-email-confirmation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const VALID_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
])

function buildRedirectUrl(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const redirectUrl = new URL(pathname, request.url)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      redirectUrl.searchParams.set(key, value)
    }
  }

  return redirectUrl
}

function normalizeOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null
  return VALID_EMAIL_OTP_TYPES.has(value as EmailOtpType) ? (value as EmailOtpType) : null
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash =
    request.nextUrl.searchParams.get('token_hash') ??
    request.nextUrl.searchParams.get('token')
  const otpType = normalizeOtpType(request.nextUrl.searchParams.get('type'))

  try {
    const supabase = createSupabaseServerClient()
    let confirmedEmail: string | null = null
    let supabaseUserId: string | null = null

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      confirmedEmail = data.user?.email?.trim().toLowerCase() ?? null
      supabaseUserId = data.user?.id ?? null
    } else if (tokenHash && otpType) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      })
      if (error) throw error
      confirmedEmail = data.user?.email?.trim().toLowerCase() ?? null
      supabaseUserId = data.user?.id ?? null
    } else {
      return NextResponse.redirect(
        buildRedirectUrl(request, '/register/check-email', {
          status: 'error',
        })
      )
    }

    if (!confirmedEmail || !supabaseUserId) {
      return NextResponse.redirect(
        buildRedirectUrl(request, '/register/check-email', {
          status: 'error',
        })
      )
    }

    const user = await activateSupabaseTrialByEmail({
      email: confirmedEmail,
      supabaseUserId,
    })

    if (!user) {
      return NextResponse.redirect(
        buildRedirectUrl(request, '/register/check-email', {
          email: confirmedEmail,
          status: 'error',
        })
      )
    }

    const registerToken = createRegisterCompletionToken(user.id)

    return NextResponse.redirect(
      buildRedirectUrl(request, '/register/verified', {
        register_token: registerToken,
      })
    )
  } catch (error) {
    console.error('Erro ao confirmar email com Supabase:', error)
    return NextResponse.redirect(
      buildRedirectUrl(request, '/register/check-email', {
        status: 'error',
      })
    )
  }
}
