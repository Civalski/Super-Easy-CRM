'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPostLoginPath } from '@/lib/crmEdition'

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

      router.replace(getPostLoginPath())
      router.refresh()
    }

    void completeLogin()

    return () => {
      active = false
    }
  }, [router, searchParams])

  if (!error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl"
        />
        <div className="relative w-full max-w-md rounded-3xl border border-emerald-400/30 bg-slate-900/90 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15">
            <svg className="h-6 w-6 text-emerald-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="m8.5 12.3 2.4 2.4 4.8-5.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white">Email confirmado</h1>
          <p className="mt-3 text-sm text-slate-300">
            Validamos seu email com sucesso e estamos entrando no CRM.
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-left">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3 5.5 5.5v6.7c0 4 2.6 7.6 6.5 8.8 3.9-1.2 6.5-4.8 6.5-8.8V5.5L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="m9.3 12.1 2 2 3.5-3.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-xs leading-5 text-cyan-100">
              Este processo protege seu acesso e confirma sua identidade no sistema.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-red-500/20 via-orange-500/10 to-transparent blur-3xl"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900/90 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Acesso pendente</h1>
        <p className="mt-3 text-sm text-slate-300">{error}</p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(getPostLoginPath())}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:from-sky-300 hover:to-cyan-300"
        >
          Entrar manualmente
        </Link>
      </div>
    </div>
  )
}
