'use client'

import type { RefObject } from 'react'
import { Button } from '@/components/common'

type PasswordResetRequestFormProps = {
  email: string
  error: string
  info?: string
  loading: boolean
  onEmailChange: (value: string) => void
  onHideTurnstilePrompt: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void
  onWebsiteChange: (value: string) => void
  showTurnstilePrompt: boolean
  turnstileContainerRef: RefObject<HTMLDivElement | null>
  turnstileReady: boolean
  turnstileSiteKey: string
  website: string
}

export function PasswordResetRequestForm({
  email,
  error,
  info,
  loading,
  onEmailChange,
  onHideTurnstilePrompt,
  onSubmit,
  onWebsiteChange,
  showTurnstilePrompt,
  turnstileContainerRef,
  turnstileReady,
  turnstileSiteKey,
  website,
}: PasswordResetRequestFormProps) {
  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor="reset-website">Website</label>
        <input
          id="reset-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => onWebsiteChange(event.target.value)}
        />
      </div>

      {turnstileSiteKey && showTurnstilePrompt ? (
        <div className="space-y-2 rounded-xl border border-slate-600/60 bg-slate-950/40 px-4 py-3">
          <p className="text-center text-xs text-slate-400">
            Confirme a verificacao anti-bot para concluir o envio do email.
          </p>
          <div className="flex justify-center">
            <div ref={turnstileContainerRef} className="inline-block min-h-[65px] w-full max-w-[320px]" />
          </div>
          {!turnstileReady ? (
            <p className="text-center text-xs text-amber-300">
              Carregando verificacao anti-bot...
            </p>
          ) : null}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onHideTurnstilePrompt}
              disabled={loading}
              className="text-xs font-medium text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar verificacao
            </button>
          </div>
        </div>
      ) : null}

      {info ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {info}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={loading} className="h-12 w-full">
        {loading ? 'Enviando...' : 'Enviar link de redefinicao'}
      </Button>
    </form>
  )
}
