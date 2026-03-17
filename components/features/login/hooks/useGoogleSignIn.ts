'use client'

import { useCallback } from 'react'
import { isSupabaseGoogleAuthEnabled } from '@/lib/supabase/client'

const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

export function useGoogleSignIn(
  callbackUrlOrOnError?: string | ((message: string) => void),
  onError?: (message: string) => void
) {
  const callbackUrl =
    typeof callbackUrlOrOnError === 'string' ? callbackUrlOrOnError : undefined
  const resolvedOnError =
    typeof callbackUrlOrOnError === 'function' ? callbackUrlOrOnError : onError

  const handleGoogleSignIn = useCallback(async () => {
    if (!isSupabaseGoogleAuthEnabled()) {
      resolvedOnError?.('Login com Google nao esta configurado.')
      return
    }
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseBrowserClient()
      const redirectTo =
        typeof window !== 'undefined'
          ? (() => {
              const url = new URL('/auth/callback', window.location.origin)
              if (
                callbackUrl &&
                callbackUrl.startsWith('/') &&
                !callbackUrl.startsWith('//')
              ) {
                url.searchParams.set('next', callbackUrl)
              }
              return url.toString()
            })()
          : undefined
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          ...(redirectTo ? { redirectTo } : {}),
          scopes: GOOGLE_OAUTH_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (oauthError) {
        resolvedOnError?.(oauthError.message || 'Falha ao iniciar login com Google.')
      }
    } catch {
      resolvedOnError?.('Ocorreu um erro ao tentar entrar com Google.')
    }
  }, [callbackUrl, resolvedOnError])

  return {
    handleGoogleSignIn,
    showGoogleSignIn: isSupabaseGoogleAuthEnabled(),
  }
}
