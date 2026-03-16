'use client'

import Script from 'next/script'
import { Button } from '@/components/common'
import { useGoogleSignIn } from '@/components/features/login/hooks/useGoogleSignIn'
import { LoginThemeToggle } from '@/components/features/login/LoginThemeToggle'
import { LOGIN_THEME_STYLES } from '@/components/features/login/constants'
import { REGISTER_COPY } from '@/components/features/register/constants'
import { RegisterForm } from '@/components/features/register/RegisterForm'
import { RegisterHero } from '@/components/features/register/RegisterHero'
import { useRegisterCheckout } from '@/components/features/register/hooks/useRegisterCheckout'
import { useThemePreference } from '@/lib/hooks/useThemePreference'

export function RegisterPageContent() {
  const { theme } = useThemePreference()
  const appearance = LOGIN_THEME_STYLES[theme]
  const {
    error,
    form,
    goToNextStep,
    goToPrevStep,
    handleSubmit,
    hasDraft,
    isFirstStep,
    isLastStep,
    isPackage,
    loading,
    loadingLabel,
    renderTurnstile,
    restoreDraft,
    discardDraft,
    setFieldError,
    step,
    totalSteps,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    updateField,
    updateTeamMember,
  } = useRegisterCheckout(theme)

  const { handleGoogleSignIn, showGoogleSignIn } = useGoogleSignIn(setFieldError)

  return (
    <div className={`relative min-h-screen overflow-hidden ${appearance.root}`}>
      <div className={`absolute inset-0 ${appearance.rootGlow}`} />

      <div className="relative grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        {turnstileSiteKey ? (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => {
              renderTurnstile()
            }}
          />
          ) : null}

        <RegisterHero appearance={appearance} />

        <div className={`relative flex flex-col items-center justify-center gap-4 ${appearance.formSection}`}>
          <div className={`pointer-events-none absolute inset-0 ${appearance.formGlow}`} />
          <div className="absolute right-3 top-4 z-20 sm:right-6 sm:top-6">
            <LoginThemeToggle />
          </div>

          {hasDraft ? (
            <div className="relative z-10 w-full max-w-3xl rounded-xl border border-amber-500/50 bg-amber-50/90 px-4 py-3 backdrop-blur-sm dark:bg-amber-950/80">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-200">
                {REGISTER_COPY.resumeDraftHint}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={restoreDraft}
                  className="border-amber-600 bg-amber-600 text-white hover:bg-amber-500 hover:text-white dark:border-amber-500"
                >
                  {REGISTER_COPY.resumeDraft}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={discardDraft}
                  className="border-amber-500/50 bg-white/70 text-amber-800 hover:bg-amber-100 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/50"
                >
                  {REGISTER_COPY.discardDraft}
                </Button>
              </div>
            </div>
          ) : null}

          <RegisterForm
            appearance={appearance}
            error={error}
            form={form}
            loading={loading}
            loadingLabel={loadingLabel}
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
            onNextStep={goToNextStep}
            onPrevStep={goToPrevStep}
            onBackToPlanSelection={() => {}}
            onUpdateField={updateField}
            onUpdateTeamMember={updateTeamMember}
            showGoogleSignIn={showGoogleSignIn}
            step={step}
            totalSteps={totalSteps}
            isPackage={isPackage}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            showTurnstile={Boolean(turnstileSiteKey)}
            turnstileContainerRef={turnstileContainerRef}
            turnstileReady={turnstileReady}
          />
        </div>
      </div>
    </div>
  )
}
