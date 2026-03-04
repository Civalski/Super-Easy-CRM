'use client'

import Script from 'next/script'
import { RegisterHero } from '@/components/features/register/RegisterHero'
import { RegisterForm } from '@/components/features/register/RegisterForm'
import { useRegisterCheckout } from '@/components/features/register/hooks/useRegisterCheckout'

export function RegisterPageContent() {
  const {
    error,
    form,
    handleSubmit,
    loading,
    renderTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    updateField,
  } = useRegisterCheckout()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.2),transparent_42%)]" />

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

        <RegisterHero />

        <RegisterForm
          error={error}
          form={form}
          loading={loading}
          onSubmit={handleSubmit}
          onUpdateField={updateField}
          showTurnstile={Boolean(turnstileSiteKey)}
          turnstileContainerRef={turnstileContainerRef}
          turnstileReady={turnstileReady}
        />
      </div>
    </div>
  )
}
