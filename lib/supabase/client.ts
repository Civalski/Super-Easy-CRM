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

    const accessToken = data.session?.access_token ?? null
    if (accessToken) {
      return {
        accessToken,
        supabase,
      }
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
  }

  return {
    accessToken: null,
    supabase,
  }
}

export function isSupabaseGoogleAuthEnabled() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
