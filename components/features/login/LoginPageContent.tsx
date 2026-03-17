'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useThemePreference } from '@/lib/hooks/useThemePreference'
import { LOGIN_THEME_STYLES } from './constants'
import { LoginFormCard } from './LoginFormCard'
import { LoginHero } from './LoginHero'
import { LoginThemeToggle } from './LoginThemeToggle'
import { useLogin } from './hooks/useLogin'

function LoginPageInner() {
  const { theme } = useThemePreference()
  const appearance = LOGIN_THEME_STYLES[theme]
  const {
    error,
    handleGoogleSignIn,
    handleSubmit,
    loading,
    password,
    setPassword,
    setUsername,
    setWebsite,
    resetSuccess,
    showTurnstilePrompt,
    showGoogleSignIn,
    hideTurnstilePrompt,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    username,
    website,
  } = useLogin(theme)

  return (
    <div className={`relative min-h-screen overflow-hidden ${appearance.root}`}>
      <div className={`absolute inset-0 ${appearance.rootGlow}`} />

      <div className="relative grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        {turnstileSiteKey && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
        )}

        <LoginHero appearance={appearance} theme={theme} />

        <section
          className={`relative flex items-center justify-center px-3 py-8 sm:px-8 lg:px-12 ${appearance.formSection}`}
        >
          <div className={`pointer-events-none absolute inset-0 ${appearance.formGlow}`} />
          <div className="absolute right-3 top-4 z-20 sm:right-6 sm:top-6">
            <LoginThemeToggle />
          </div>

          <LoginFormCard
            appearance={appearance}
            error={error}
            loading={loading}
            resetSuccess={resetSuccess}
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
            password={password}
            setPassword={setPassword}
            setUsername={setUsername}
            setWebsite={setWebsite}
            showTurnstilePrompt={showTurnstilePrompt}
            showGoogleSignIn={showGoogleSignIn}
            onHideTurnstilePrompt={hideTurnstilePrompt}
            turnstileContainerRef={turnstileContainerRef}
            turnstileReady={turnstileReady}
            turnstileSiteKey={turnstileSiteKey}
            theme={theme}
            username={username}
            website={website}
          />

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 text-[11px] text-slate-400">
            <Link
              href="https://www.arkersoft.com.br/termos-de-uso"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-slate-200"
            >
              Termos de Uso
            </Link>
            <span aria-hidden="true">|</span>
            <Link
              href="https://www.arkersoft.com.br/seusdados"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-slate-200"
            >
              Politica de Privacidade
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export function LoginPageContent() {
  return (
    <Suspense fallback={<div className={`min-h-screen ${LOGIN_THEME_STYLES.dark.fallback}`} />}>
      <LoginPageInner />
    </Suspense>
  )
}
