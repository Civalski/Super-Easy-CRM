'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export function RegisterVerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const registerToken = searchParams.get('register_token')

    if (!registerToken) {
      setError('Nao foi possivel concluir a confirmacao do email.')
      return
    }

    let active = true

    async function completeLogin() {
      const result = await signIn('credentials', {
        redirect: false,
        registerToken,
      })

      if (!active) return

      if (!result?.ok || result.error) {
        setError(
          'Seu email foi confirmado, mas o acesso automatico falhou. Entre manualmente para continuar.'
        )
        return
      }

      router.replace('/dashboard')
      router.refresh()
    }

    void completeLogin()

    return () => {
      active = false
    }
  }, [router, searchParams])

  if (!error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/80 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-semibold text-white">Email confirmado</h1>
          <p className="mt-3 text-sm text-slate-300">
            Estamos liberando seu trial gratis e entrando no CRM.
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
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Entrar manualmente
        </Link>
      </div>
    </div>
  )
}
