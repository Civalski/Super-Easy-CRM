'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function ConfirmEmailStatus() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const hasError = searchParams.get('status') === 'error'
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const title = hasError ? 'Nao conseguimos confirmar seu email' : 'Confirme seu email'
  const description = useMemo(() => {
    if (hasError) {
      return 'O link pode ter expirado ou ja ter sido usado. Reenvie a confirmacao abaixo para liberar os 7 dias gratis.'
    }

    return 'Enviamos um link de confirmacao para liberar seus 7 dias gratis sem cartao.'
  }, [hasError])

  async function handleResend() {
    if (!email || loading) return

    setLoading(true)
    setFeedback('')

    try {
      const response = await fetch('/api/auth/register/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setFeedback(payload.error ?? 'Nao foi possivel reenviar o email agora.')
        return
      }

      setFeedback('Pronto. Reenviamos o email de confirmacao.')
    } catch {
      setFeedback('Nao foi possivel reenviar o email agora.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700/70 bg-slate-900/85 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
          Trial sem cartao
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>

        {email ? (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email cadastrado</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-100">{email}</p>
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              feedback.startsWith('Pronto')
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={!email || loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Reenviando...' : 'Reenviar email'}
          </button>
          <Link
            href="/login?callbackUrl=/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
