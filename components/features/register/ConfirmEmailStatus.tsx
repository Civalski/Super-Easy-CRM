'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTurnstileWidget } from '@/components/common/turnstile/useTurnstileWidget'
import { getPostLoginPath } from '@/lib/crmEdition'

export function ConfirmEmailStatus() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const hasError = searchParams.get('status') === 'error'
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [showTurnstilePrompt, setShowTurnstilePrompt] = useState(false)
  const [website, setWebsite] = useState('')
  const {
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    turnstileToken,
  } = useTurnstileWidget({
    action: 'resend_confirmation',
    enabled: showTurnstilePrompt,
    errorMessage: 'Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.',
    onError: setFeedback,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '',
    size: 'flexible',
    theme: 'dark',
  })

  const title = hasError ? 'Nao conseguimos confirmar seu email' : 'Confirme seu email'
  const description = useMemo(() => {
    if (hasError) {
      return 'O link pode ter expirado ou ja ter sido usado. Reenvie a confirmacao abaixo para liberar seu acesso.'
    }

    return 'Enviamos um link de confirmacao para liberar seu acesso com seguranca.'
  }, [hasError])

  const hideTurnstilePrompt = useCallback(() => {
    setPendingSubmit(false)
    setShowTurnstilePrompt(false)
    resetTurnstile()
  }, [resetTurnstile])

  const submitResendRequest = useCallback(async () => {
    setLoading(true)
    setFeedback('')

    try {
      const response = await fetch('/api/auth/register/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          turnstileToken,
          website,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        hideTurnstilePrompt()
        setFeedback(payload.error ?? 'Nao foi possivel reenviar o email agora.')
        return
      }

      hideTurnstilePrompt()
      setFeedback('Pronto. Reenviamos o email de confirmacao.')
    } catch {
      hideTurnstilePrompt()
      setFeedback('Nao foi possivel reenviar o email agora.')
    } finally {
      setLoading(false)
    }
  }, [email, hideTurnstilePrompt, turnstileToken, website])

  async function handleResend() {
    if (!email || loading) return

    if (turnstileSiteKey && !turnstileToken) {
      setPendingSubmit(true)
      setShowTurnstilePrompt(true)
      setFeedback(
        turnstileReady
          ? 'Confirme a verificacao anti-bot para reenviar o email.'
          : 'A verificacao anti-bot esta sendo preparada. Aguarde um instante.'
      )
      return
    }

    await submitResendRequest()
  }

  useEffect(() => {
    if (!pendingSubmit || !turnstileToken) return

    setPendingSubmit(false)
    void submitResendRequest()
  }, [pendingSubmit, submitResendRequest, turnstileToken])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-500/20 via-cyan-500/10 to-transparent blur-3xl"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/90 p-8 shadow-2xl">
        {turnstileSiteKey ? (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
        ) : null}

        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="m5.5 7 6.5 5 6.5-5M9.2 15.2l1.5 1.5 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Confirmacao de email
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>

        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
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
            Confirmar seu email garante a seguranca da conta e libera o acesso completo ao CRM.
          </p>
        </div>

        {email ? (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email cadastrado</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-100">{email}</p>
          </div>
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor="confirm-email-website">Website</label>
          <input
            id="confirm-email-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {turnstileSiteKey && showTurnstilePrompt ? (
          <div className="mt-5 space-y-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
            <p className="text-center text-xs text-slate-400">
              Confirme a verificacao anti-bot para concluir o reenvio.
            </p>
            <div className="flex justify-center">
              <div
                ref={turnstileContainerRef}
                className="inline-block min-h-[65px] w-full max-w-[320px]"
              />
            </div>
            {!turnstileReady ? (
              <p className="text-center text-xs text-amber-300">
                Carregando verificacao anti-bot...
              </p>
            ) : null}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={hideTurnstilePrompt}
                disabled={loading}
                className="text-xs font-medium text-sky-300 transition hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar verificacao
              </button>
            </div>
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
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:from-sky-300 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Reenviando...' : 'Reenviar email'}
          </button>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(getPostLoginPath())}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
