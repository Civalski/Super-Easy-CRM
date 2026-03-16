'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserAccessToken } from '@/lib/supabase/client'

function getOAuthCodeStorageKey(code: string) {
  return `auth:google-oauth-code:${code}`
}

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const nextPath = searchParams.get('next') ?? '/'

    const redirectToLogin = (error?: string) => {
      const params = new URLSearchParams()
      if (error) params.set('error', error)
      if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
      router.replace(`/login?${params.toString()}`)
    }

    if (errorParam) {
      setStatus('error')
      redirectToLogin('oauth_failed')
      return
    }

    if (!code) {
      setStatus('error')
      redirectToLogin('oauth_missing_code')
      return
    }

    const run = async () => {
      const storageKey = getOAuthCodeStorageKey(code)

      try {
        if (typeof window !== 'undefined') {
          const handledCode = window.sessionStorage.getItem(storageKey)
          if (handledCode === 'processing' || handledCode === 'done') {
            return
          }
          window.sessionStorage.setItem(storageKey, 'processing')
        }

        const { accessToken, supabase } = await getSupabaseBrowserAccessToken()
        if (!accessToken) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(storageKey)
          }
          setStatus('error')
          redirectToLogin('oauth_missing_session')
          return
        }

        const res = await fetch('/api/auth/oauth-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        })

        const json = (await res.json().catch(() => null)) as
          | { error?: string; registerToken?: string }
          | null

        if (!res.ok || !json?.registerToken) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(storageKey)
          }
          setStatus('error')
          redirectToLogin(json?.error || 'oauth_user_failed')
          return
        }

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(storageKey, 'done')
        }

        await supabase.auth.signOut().catch(() => undefined)

        const params = new URLSearchParams()
        params.set('register_token', json.registerToken)
        if (nextPath && nextPath !== '/') params.set('callbackUrl', nextPath)
        router.replace(`/login?${params.toString()}`)
      } catch (err) {
        console.error('Erro no callback OAuth:', err)
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(storageKey)
        }
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
