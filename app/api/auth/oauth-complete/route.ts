import { NextRequest, NextResponse } from 'next/server'
import { createRegisterCompletionToken } from '@/lib/auth/register-completion-token'
import { findOrCreateUserFromGoogleOAuth } from '@/lib/auth/supabase-google-oauth'
import { upsertGoogleOAuthTokensForUser } from '@/lib/google-drive/service'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'

export const dynamic = 'force-dynamic'

const oauthCompleteRateLimitConfig = {
  windowMs: 10 * 60 * 1000,
  maxAttempts: 10,
  blockDurationMs: 15 * 60 * 1000,
}

function readOptionalBodyString(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitResponse = await enforceApiRateLimit({
      key: `api:auth:oauth-complete:ip:${ip}`,
      config: oauthCompleteRateLimitConfig,
      error: 'Muitas tentativas de login. Aguarde antes de tentar novamente.',
    })
    if (rateLimitResponse) return rateLimitResponse
    const body = await request.json()
    const accessToken = readOptionalBodyString((body as { accessToken?: unknown })?.accessToken) ?? ''

    if (!accessToken) {
      return NextResponse.json(
        { error: 'oauth_missing_token' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error('OAuth complete: token invalido', error)
      return NextResponse.json(
        { error: 'oauth_invalid_token' },
        { status: 401 }
      )
    }

    const email = user.email?.trim().toLowerCase()
    const supabaseUserId = user.id

    if (!email || !supabaseUserId) {
      return NextResponse.json(
        { error: 'oauth_no_email' },
        { status: 400 }
      )
    }

    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      (typeof user.user_metadata?.email === 'string' ? user.user_metadata.email : null)

    const userId = await findOrCreateUserFromGoogleOAuth({
      email,
      name: typeof name === 'string' ? name : null,
      supabaseUserId,
    })

    if (!userId) {
      return NextResponse.json(
        { error: 'oauth_user_failed' },
        { status: 500 }
      )
    }

    const registerToken = createRegisterCompletionToken(userId)

    const providerAccessToken = readOptionalBodyString(
      (body as { providerAccessToken?: unknown })?.providerAccessToken
    )
    const providerRefreshToken = readOptionalBodyString(
      (body as { providerRefreshToken?: unknown })?.providerRefreshToken
    )
    const providerTokenType = readOptionalBodyString(
      (body as { providerTokenType?: unknown })?.providerTokenType
    )
    const providerScope = readOptionalBodyString(
      (body as { providerScope?: unknown })?.providerScope
    )
    const providerTokenExpiresAt = readOptionalBodyString(
      (body as { providerTokenExpiresAt?: unknown })?.providerTokenExpiresAt
    )

    if (providerAccessToken || providerRefreshToken) {
      try {
        await upsertGoogleOAuthTokensForUser({
          userId,
          supabaseUserId,
          accessToken: providerAccessToken,
          refreshToken: providerRefreshToken,
          tokenType: providerTokenType,
          scope: providerScope,
          expiresAtIso: providerTokenExpiresAt,
        })
      } catch (tokenError) {
        console.error('OAuth complete: falha ao persistir token do Google Drive', tokenError)
      }
    }

    return NextResponse.json({ registerToken })
  } catch (err) {
    console.error('Erro em oauth-complete:', err)
    return NextResponse.json(
      { error: 'oauth_error' },
      { status: 500 }
    )
  }
}
