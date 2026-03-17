'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createSupabaseBrowserClient,
  extractOAuthProviderSessionData,
  getSupabaseBrowserAccessToken,
} from '@/lib/supabase/client'
import {
  readAuthFlowCookie,
  writeAuthFlowCookie,
  clearAuthFlowCookie,
  createFlowNonce,
} from '@/lib/cookies'

function resolveOAuthErrorCode(
  errorParam?: string | null,
  errorCode?: string | null,
  errorDescription?: string | null
) {
  const combined = [errorParam, errorCode, errorDescription]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (
    combined.includes('redirect') &&
    (combined.includes('allow') || combined.includes('not allowed'))
  ) {
    return 'oauth_redirect_not_allowed'
  }

  if (
    combined.includes('pkce') ||
    combined.includes('state') ||
    combined.includes('code verifier')
  ) {
    return 'oauth_state_mismatch'
  }

  return 'oauth_failed'
}

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')
    const nextPath = searchParams.get('next') ?? '/'

    const redirectToLogin = (error?: string) => {
      const params = new URLSearchParams()
      if (error) params.set('error', error)
      if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
      router.replace(`/login?${params.toString()}`)
    }

    if (errorParam) {
      console.error('OAuth callback retornou erro antes da troca de sessao', {
        errorParam,
        errorCode,
        errorDescription,
      })
      setStatus('error')
      redirectToLogin(resolveOAuthErrorCode(errorParam, errorCode, errorDescription))
      return
    }

    if (!code) {
      setStatus('error')
      redirectToLogin('oauth_missing_code')
      return
    }

    const run = async () => {
      const nonce = createFlowNonce(code)
      const flow = readAuthFlowCookie()

      if (flow?.nonce === nonce && flow?.status === 'done') {
        clearAuthFlowCookie()
        const params = new URLSearchParams()
        if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
        router.replace(`/login?${params.toString()}`)
        return
      }

      if (flow?.nonce === nonce && flow?.status === 'processing') {
        return
      }

      try {
        const supabase = createSupabaseBrowserClient()

        writeAuthFlowCookie({
          source: 'oauth',
          callbackUrl: nextPath !== '/' ? nextPath : undefined,
          nonce,
          status: 'processing',
        })

        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('Falha ao concluir OAuth com Google', {
            message: exchangeError.message,
            name: exchangeError.name,
            status: 'status' in exchangeError ? exchangeError.status : undefined,
          })
          clearAuthFlowCookie()
          setStatus('error')
          redirectToLogin(resolveOAuthErrorCode(null, null, exchangeError.message))
          return
        }

        const exchangedSession = exchangeData.session
        const exchangedProviderData = extractOAuthProviderSessionData(exchangedSession)
        const sessionData = exchangedSession?.access_token
          ? {
              accessToken: exchangedSession.access_token,
              supabase,
              ...exchangedProviderData,
            }
          : await getSupabaseBrowserAccessToken()

        const {
          accessToken,
          providerAccessToken,
          providerRefreshToken,
          providerTokenType,
          providerScope,
          providerTokenExpiresAt,
        } = sessionData

        if (!accessToken) {
          clearAuthFlowCookie()
          setStatus('error')
          redirectToLogin('oauth_missing_session')
          return
        }

        const res = await fetch('/api/auth/oauth-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            providerAccessToken,
            providerRefreshToken,
            providerTokenType,
            providerScope,
            providerTokenExpiresAt,
          }),
        })

        const json = (await res.json().catch(() => null)) as
          | { error?: string; registerToken?: string }
          | null

        if (!res.ok || !json?.registerToken) {
          clearAuthFlowCookie()
          setStatus('error')
          redirectToLogin(json?.error || 'oauth_user_failed')
          return
        }

        writeAuthFlowCookie({
          source: 'oauth',
          callbackUrl: nextPath !== '/' ? nextPath : undefined,
          nonce,
          status: 'done',
        })

        await supabase.auth.signOut().catch(() => undefined)

        const params = new URLSearchParams()
        params.set('register_token', json.registerToken)
        if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
        clearAuthFlowCookie()
        if (typeof window !== 'undefined') {
          window.location.replace(`/login?${params.toString()}`)
          return
        }
        router.replace(`/login?${params.toString()}`)
      } catch (err) {
        console.error('Erro no callback OAuth:', err)
        clearAuthFlowCookie()
        setStatus('error')
        redirectToLogin('oauth_error')
      }
    }

    run()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-sm text-slate-400">Concluindo login com Google...</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Redirecionando...</p>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
