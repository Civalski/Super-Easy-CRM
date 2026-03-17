'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()
)?.trim()

/**
 * Cliente Supabase para uso no browser. O @supabase/ssr ja configura PKCE,
 * cookies e deteccao do callback OAuth automaticamente no navegador.
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorios para login com Google.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function readOptionalNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function extractOAuthProviderSessionData(session: unknown) {
  if (!session || typeof session !== 'object') {
    return {
      providerAccessToken: null,
      providerRefreshToken: null,
      providerTokenType: null,
      providerScope: null,
      providerTokenExpiresAt: null,
    }
  }

  const source = session as Record<string, unknown>
  const providerAccessToken = readOptionalString(source.provider_token)
  const providerRefreshToken = readOptionalString(source.provider_refresh_token)
  const providerTokenType = readOptionalString(source.token_type)
  const providerScope = readOptionalString(source.scope)
  const expiresAtUnix = readOptionalNumber(source.expires_at)

  return {
    providerAccessToken,
    providerRefreshToken,
    providerTokenType,
    providerScope,
    providerTokenExpiresAt: expiresAtUnix
      ? new Date(expiresAtUnix * 1000).toISOString()
      : null,
  }
}

export async function getSupabaseBrowserAccessToken(
  maxAttempts = 6,
  delayMs = 250
) {
  const supabase = createSupabaseBrowserClient()

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    const session = data.session
    const accessToken = session?.access_token ?? null
    const oauthProviderData = extractOAuthProviderSessionData(session)

    if (accessToken) {
      return {
        accessToken,
        supabase,
        ...oauthProviderData,
      }
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
  }

  return {
    accessToken: null,
    supabase,
    providerAccessToken: null,
    providerRefreshToken: null,
    providerTokenType: null,
    providerScope: null,
    providerTokenExpiresAt: null,
  }
}

export function isSupabaseGoogleAuthEnabled() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
