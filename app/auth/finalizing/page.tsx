'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRegisterTokenSignIn } from '@/components/features/login/hooks/useRegisterTokenSignIn'

function AuthFinalizingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const stableSetError = useCallback((message: string) => {
    setError(message)
  }, [])

  const hasFlow =
    searchParams.get('register_complete') === '1' ||
    Boolean(searchParams.get('register_token')?.trim())

  useEffect(() => {
    if (!hasFlow) {
      router.replace('/login')
    }
  }, [hasFlow, router])

  useRegisterTokenSignIn(stableSetError, 'oauthBridge')

  if (!hasFlow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-slate-100">
        <p className="text-sm text-slate-300">{error}</p>
        <Link
          href="/login"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
        <p className="text-sm text-slate-400">Entrando no CRM...</p>
      </div>
    </div>
  )
}

export default function AuthFinalizingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <AuthFinalizingInner />
    </Suspense>
  )
}
