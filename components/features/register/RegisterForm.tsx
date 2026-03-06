'use client'

import Link from 'next/link'
import { ArrowRight } from '@/lib/icons'
import { REGISTER_COPY } from '@/components/features/register/constants'
import type { RegisterFormValues } from '@/components/features/register/types'

interface RegisterFormProps {
  error: string
  form: RegisterFormValues
  loading: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onUpdateField: (field: keyof RegisterFormValues, value: string) => void
  showTurnstile: boolean
  turnstileContainerRef: React.RefObject<HTMLDivElement | null>
  turnstileReady: boolean
}

export function RegisterForm({
  error,
  form,
  loading,
  onSubmit,
  onUpdateField,
  showTurnstile,
  turnstileContainerRef,
  turnstileReady,
}: RegisterFormProps) {
  return (
    <section className="relative flex items-center justify-center bg-slate-950 px-2 py-6 sm:px-6 lg:px-10">
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-600/70 bg-slate-800/65 p-4 shadow-[0_30px_60px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-6">
        <div className="mb-4 space-y-1.5 text-left">
          <h2 className="crm-display text-3xl font-semibold text-white">Criar conta</h2>
          <p className="text-sm text-slate-300">Informe seus dados e o codigo de registro.</p>
        </div>

        <form className="relative grid gap-3 sm:gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-200">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Seu nome"
              value={form.name}
              onChange={(event) => onUpdateField('name', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={form.email}
              onChange={(event) => onUpdateField('email', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-slate-200">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="seu.usuario"
              value={form.username}
              onChange={(event) => onUpdateField('username', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="********"
              value={form.password}
              onChange={(event) => onUpdateField('password', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="********"
              value={form.confirmPassword}
              onChange={(event) => onUpdateField('confirmPassword', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden opacity-0"
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => onUpdateField('website', event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="code" className="text-sm font-medium text-slate-200">
              Codigo de registro
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              placeholder="Digite o codigo"
              value={form.code}
              onChange={(event) => onUpdateField('code', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400/90 outline-hidden transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 md:col-span-2">
              {error}
            </div>
          )}

          <p className="pt-1 text-center text-xs text-slate-400 md:col-span-2">
            O acesso e liberado apenas com codigo de registro valido.
          </p>

          {showTurnstile && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-center text-xs text-slate-400">
                Confirme a verificacao anti-bot para continuar.
              </p>
              <div className="flex justify-center">
                <div ref={turnstileContainerRef} className="inline-block min-h-[65px]" />
              </div>
            </div>
          )}

          {showTurnstile && !turnstileReady && (
            <p className="text-center text-xs text-amber-300 md:col-span-2">
              {REGISTER_COPY.loadingAntiBot}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {loading ? REGISTER_COPY.creatingAccount : REGISTER_COPY.submitLabel}
            {!loading && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-sm text-slate-300 md:col-span-2">
            Ja tem conta?{' '}
            <Link href="/login" className="font-medium text-indigo-300 transition hover:text-indigo-200">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </section>
  )
}
