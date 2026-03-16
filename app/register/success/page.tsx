'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const stripeSessionId = searchParams.get('session_id')
    const registerToken = searchParams.get('register_token')

    if (!stripeSessionId || !registerToken) {
      setError('Nao foi possivel validar o retorno do Stripe.')
      return
    }

    let active = true

    async function completeCheckoutLogin() {
      const result = await signIn('credentials', {
        redirect: false,
        registerToken,
        stripeSessionId,
      })

      if (!active) return

      if (!result?.ok || result.error) {
        setError('Pagamento confirmado, mas o acesso automatico falhou. Entre manualmente para continuar.')
        return
      }

      router.replace('/dashboard?subscription=success')
      router.refresh()
    }

    void completeCheckoutLogin()

    return () => {
      active = false
    }
  }, [router, searchParams])

  if (!error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/80 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-semibold text-white">Confirmando seu acesso</h1>
          <p className="mt-3 text-sm text-slate-300">
            Estamos validando seu pagamento no Stripe e liberando a entrada no CRM.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900/80 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Acesso pendente</h1>
        <p className="mt-3 text-sm text-slate-300">{error}</p>
        <Link
          href="/login?callbackUrl=/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Entrar manualmente
        </Link>
      </div>
    </div>
  )
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <RegisterSuccessContent />
    </Suspense>
  )
}
