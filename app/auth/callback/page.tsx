'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createSupabaseBrowserClient,
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
        // Evita lock de fluxo quando uma tentativa anterior travou no cliente.
        clearAuthFlowCookie()
      }

      try {
        const supabase = createSupabaseBrowserClient()

        writeAuthFlowCookie({
          source: 'oauth',
          callbackUrl: nextPath !== '/' ? nextPath : undefined,
          nonce,
          status: 'processing',
        })

        // O createBrowserClient do @supabase/ssr detecta callbacks PKCE
        // automaticamente no navegador. Chamar exchangeCodeForSession()
        // aqui novamente pode consumir o code verifier duas vezes.
        const sessionData = (await Promise.race([
          getSupabaseBrowserAccessToken(10, 250),
          new Promise<never>((_, reject) =>
            window.setTimeout(() => reject(new Error('oauth_timeout')), 12000)
          ),
        ])) as Awaited<ReturnType<typeof getSupabaseBrowserAccessToken>>

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
        params.set('register_complete', '1')
        if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
        clearAuthFlowCookie()
        if (typeof window !== 'undefined') {
          try { sessionStorage.setItem('__register_token', json.registerToken) } catch {}
          window.location.replace(`/auth/finalizing?${params.toString()}`)
          return
        }
        router.replace(`/auth/finalizing?${params.toString()}`)
      } catch (err) {
        console.error('Erro no callback OAuth:', err)
        clearAuthFlowCookie()
        setStatus('error')
        if (err instanceof Error && err.message === 'oauth_timeout') {
          redirectToLogin('oauth_timeout')
          return
        }
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
