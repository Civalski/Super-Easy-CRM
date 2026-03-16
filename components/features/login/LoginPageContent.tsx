'use client'

import { Suspense } from 'react'
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
    renderTurnstile,
    setPassword,
    setUsername,
    setWebsite,
    resetSuccess,
    showGoogleSignIn,
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
            onReady={() => {
              renderTurnstile()
            }}
          />
        )}

        <LoginHero appearance={appearance} />

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
            showGoogleSignIn={showGoogleSignIn}
            turnstileContainerRef={turnstileContainerRef}
            turnstileReady={turnstileReady}
            turnstileSiteKey={turnstileSiteKey}
            username={username}
            website={website}
          />
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
