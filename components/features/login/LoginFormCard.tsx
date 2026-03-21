import type { FormEvent, RefObject } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/common'
import { ArrowRight, QuestionMarkCircle } from '@/lib/icons'
import type { LoginThemeAppearance } from './types'
import type { AppTheme } from '@/lib/ui/themePreference'
import { LoginEmailConfirmationPanel } from './LoginEmailConfirmationPanel'

type LoginFormCardProps = {
  appearance: LoginThemeAppearance
  error: string
  loading: boolean
  onHideTurnstilePrompt: () => void
  resetSuccess?: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onGoogleSignIn?: () => void
  password: string
  setPassword: (value: string) => void
  setUsername: (value: string) => void
  setWebsite: (value: string) => void
  showTurnstilePrompt: boolean
  showGoogleSignIn: boolean
  turnstileContainerRef: RefObject<HTMLDivElement | null>
  turnstileReady: boolean
  turnstileSiteKey: string
  theme: AppTheme
  username: string
  website: string
}

export function LoginFormCard({
  appearance,
  error,
  loading,
  onHideTurnstilePrompt,
  resetSuccess,
  onSubmit,
  onGoogleSignIn,
  password,
  setPassword,
  setUsername,
  setWebsite,
  showTurnstilePrompt,
  showGoogleSignIn,
  turnstileContainerRef,
  turnstileReady,
  turnstileSiteKey,
  theme,
  username,
  website,
}: LoginFormCardProps) {
  const logoSrc = theme === 'dark' ? '/arker10.png' : '/arkercrmlogo.png?v=3'
  const logoWidth = theme === 'dark' ? 220 : 240
  const logoHeight = theme === 'dark' ? 56 : 88
  const logoClassName = theme === 'dark' ? 'h-10 w-auto object-contain' : 'h-12 w-auto object-contain'
  return (
    <div
      className={`relative z-10 w-full max-w-md rounded-[2rem] border p-4 sm:p-8 ${appearance.formCard}`}
    >
      <div className="mb-7 flex justify-center">
        <div className="relative flex h-12 w-[220px] items-center justify-center">
          <Image
            src={logoSrc}
            alt="Arker CRM"
            width={logoWidth}
            height={logoHeight}
            className={logoClassName}
          />
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <LoginEmailConfirmationPanel appearance={appearance} />

        <div className="space-y-1.5">
          <label htmlFor="username" className={`text-sm font-medium ${appearance.label}`}>
            Usuario ou email
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="seu.usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={`h-12 w-full rounded-xl border px-4 text-sm outline-hidden transition ${appearance.input}`}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={`text-sm font-medium ${appearance.label}`}>
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`h-12 w-full rounded-xl border px-4 text-sm outline-hidden transition ${appearance.input}`}
          />
        </div>

        <div className="flex justify-center">
          <Link
            href="/auth/reset-password"
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${appearance.link}`}
          >
            <QuestionMarkCircle size={14} className="shrink-0" />
            Redefinir senha
          </Link>
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
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {resetSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
            Senha alterada com sucesso. Faca login com sua nova senha.
          </div>
        )}

        {error && (
          <div className={`rounded-xl border px-3 py-2 text-sm ${appearance.errorBox}`}>
            {error}
          </div>
        )}

        {turnstileSiteKey && showTurnstilePrompt && (
          <div className="space-y-2 rounded-2xl border border-slate-500/20 bg-slate-950/25 px-4 py-3">
            <p className={`text-center text-xs ${appearance.helperText}`}>
              Confirme que voce nao e um bot antes de entrar.
            </p>
            <div className="flex justify-center">
              <div ref={turnstileContainerRef} className="inline-block min-h-[65px] w-full max-w-[320px]" />
            </div>
            {!turnstileReady && (
              <p className={`text-center text-xs ${appearance.turnstileMessage}`}>
                Carregando verificacao anti-bot...
              </p>
            )}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onHideTurnstilePrompt}
                disabled={loading}
                className={`text-xs font-medium transition ${appearance.link} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Cancelar verificacao
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
            {!loading && <ArrowRight size={16} />}
          </Button>

          {showGoogleSignIn && onGoogleSignIn && (
            <>
              <div className={`flex items-center gap-3 text-xs ${appearance.helperText}`}>
                <span className="h-px flex-1 bg-current opacity-20" />
                <span>ou</span>
                <span className="h-px flex-1 bg-current opacity-20" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={onGoogleSignIn}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Entrar com Google</span>
              </button>
            </>
          )}
        </div>

        <p className={`pt-1 text-center text-xs ${appearance.helperText}`}>
          Ao acessar, voce concorda com as politicas internas da plataforma.
        </p>

        <p className={`text-center text-sm ${appearance.helperText}`}>
          Nao tem acesso?{' '}
          <Link href="/register" className={`font-medium transition ${appearance.link}`}>
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  )
}
