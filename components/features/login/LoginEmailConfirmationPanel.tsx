'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTurnstileWidget } from '@/components/common/turnstile/useTurnstileWidget'
import type { LoginThemeAppearance } from './types'

type LoginEmailConfirmationPanelProps = {
  appearance: LoginThemeAppearance
}

export function LoginEmailConfirmationPanel({
  appearance,
}: LoginEmailConfirmationPanelProps) {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')?.trim().toLowerCase() ?? ''
  const confirmationState = searchParams.get('confirmation')
  const confirmed = searchParams.get('confirmed') === '1'
  const shouldShow = Boolean(email) && (confirmed || confirmationState === 'pending' || confirmationState === 'required')
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
    enabled: shouldShow && showTurnstilePrompt,
    errorMessage: 'Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.',
    onError: setFeedback,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '',
    size: 'flexible',
    theme: 'dark',
  })

  const copy = useMemo(() => {
    if (confirmed) {
      return {
        title: 'Email confirmado',
        description:
          'Seu email foi validado. Estamos liberando sua entrada no CRM para continuar as configuracoes iniciais.',
      }
    }

    if (confirmationState === 'required') {
      return {
        title: 'Confirme seu email para entrar',
        description:
          'Sua conta foi criada, mas o acesso ao CRM so e liberado depois da confirmacao. Reenvie o link abaixo se precisar.',
      }
    }

    return {
      title: 'Confirme seu email',
      description:
        'Enviamos um link para concluir o cadastro. Assim que confirmar, voce entra automaticamente no CRM para fazer as configuracoes basicas e o tour.',
    }
  }, [confirmationState, confirmed])

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

  const handleResend = useCallback(async () => {
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
  }, [email, loading, submitResendRequest, turnstileReady, turnstileSiteKey, turnstileToken])

  useEffect(() => {
    if (!pendingSubmit || !turnstileToken) return

    setPendingSubmit(false)
    void submitResendRequest()
  }, [pendingSubmit, submitResendRequest, turnstileToken])

  if (!shouldShow) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Confirmacao de email
        </p>
        <h2 className="mt-2 text-base font-semibold text-white">{copy.title}</h2>
        <p className={`mt-1 text-sm leading-6 ${appearance.helperText}`}>{copy.description}</p>

        <div className="mt-3 rounded-xl border border-slate-500/20 bg-slate-950/30 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Email cadastrado</p>
          <p className="mt-1 break-all text-sm font-medium text-slate-100">{email}</p>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0"
        >
          <label htmlFor="login-confirm-email-website">Website</label>
          <input
            id="login-confirm-email-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {!confirmed ? (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={!email || loading}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:from-sky-300 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Reenviando...' : 'Reenviar email'}
          </button>
        ) : null}
      </div>

      {turnstileSiteKey && showTurnstilePrompt ? (
        <div className="space-y-2 rounded-2xl border border-slate-500/20 bg-slate-950/25 px-4 py-3">
          <p className={`text-center text-xs ${appearance.helperText}`}>
            Confirme a verificacao anti-bot para concluir o reenvio.
          </p>
          <div className="flex justify-center">
            <div
              ref={turnstileContainerRef}
              className="inline-block min-h-[65px] w-full max-w-[320px]"
            />
          </div>
          {!turnstileReady ? (
            <p className={`text-center text-xs ${appearance.turnstileMessage}`}>
              Carregando verificacao anti-bot...
            </p>
          ) : null}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={hideTurnstilePrompt}
              disabled={loading}
              className={`text-xs font-medium transition ${appearance.link} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Cancelar verificacao
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            feedback.startsWith('Pronto')
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
              : appearance.errorBox
          }`}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  )
}
