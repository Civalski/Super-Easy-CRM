'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPostLoginPath } from '@/lib/crmEdition'
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus'
import { SubscriptionPlanPrompt } from './SubscriptionPlanPrompt'
import type { RegisterPlanId } from '@/components/features/register/types'

type CheckoutStartPayload = {
  url?: string | null
  error?: string
}

type OnboardingStatusPayload = {
  completed: boolean
}

const PREMIUM_TRIAL_DAYS = 30

async function fetchOnboardingStatus() {
  const response = await fetch('/api/users/me/onboarding', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Falha ao consultar onboarding')
  }

  return (await response.json()) as OnboardingStatusPayload
}

async function fetchSubscriptionStatus() {
  const response = await fetch('/api/billing/subscription', { cache: 'no-store' })
  if (!response.ok) return null
  return (await response.json()) as { active?: boolean }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [loadingOnboarding, setLoadingOnboarding] = useState(true)
  const [waitingGuideFinish, setWaitingGuideFinish] = useState(false)
  const [checkoutRequested, setCheckoutRequested] = useState(false)
  const [planPromptOpen, setPlanPromptOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<RegisterPlanId>('plan_1')
  const [startingCheckout, setStartingCheckout] = useState(false)
  const [verifyingCheckout, setVerifyingCheckout] = useState(false)
  const startingCheckoutRef = useRef(false)
  const subscriptionState = searchParams.get('subscription')
  const handlingCheckoutReturn =
    subscriptionState === 'success' || subscriptionState === 'canceled'

  const {
    billingEnabled: billingSubscriptionEnabled,
    active,
    isLoading: subscriptionLoading,
    mutate: mutateSubscription,
  } = useSubscriptionStatus({
    enabled: status === 'authenticated',
    dedupingIntervalMs: 5_000,
  })

  useEffect(() => {
    if (status !== 'authenticated' || !billingSubscriptionEnabled) {
      setLoadingOnboarding(false)
      return
    }

    let activeRequest = true
    setLoadingOnboarding(true)

    void fetchOnboardingStatus()
      .then((data) => {
        if (!activeRequest) return
        setOnboardingCompleted(Boolean(data.completed))
      })
      .catch(() => {
        if (!activeRequest) return
        setOnboardingCompleted(false)
      })
      .finally(() => {
        if (!activeRequest) return
        setLoadingOnboarding(false)
      })

    return () => {
      activeRequest = false
    }
  }, [billingSubscriptionEnabled, status])

  useEffect(() => {
    const handleOnboardingCompleted = () => {
      setOnboardingCompleted(true)
      setWaitingGuideFinish(true)
    }

    const handleGuideFinished = () => {
      setWaitingGuideFinish(false)
    }

    const handleOnboardingReset = () => {
      setOnboardingCompleted(false)
      setWaitingGuideFinish(false)
      setCheckoutRequested(false)
      setPlanPromptOpen(false)
    }

    window.addEventListener('arker:onboarding-completed', handleOnboardingCompleted)
    window.addEventListener('arker:guide-finished', handleGuideFinished)
    window.addEventListener('arker:onboarding-reset', handleOnboardingReset)

    return () => {
      window.removeEventListener('arker:onboarding-completed', handleOnboardingCompleted)
      window.removeEventListener('arker:guide-finished', handleGuideFinished)
      window.removeEventListener('arker:onboarding-reset', handleOnboardingReset)
    }
  }, [])

  const startHostedCheckout = useCallback(async () => {
    if (startingCheckoutRef.current || !billingSubscriptionEnabled || active) return

    startingCheckoutRef.current = true
    setCheckoutRequested(true)
    setPlanPromptOpen(false)
    setStartingCheckout(true)

    try {
      const response = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          trialDays: PREMIUM_TRIAL_DAYS,
        }),
      })
      const payload = (await response.json()) as CheckoutStartPayload

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Falha ao iniciar checkout')
      }

      window.location.assign(payload.url)
    } catch (error) {
      console.error('Falha ao redirecionar para checkout Stripe:', error)
      setPlanPromptOpen(true)
      setCheckoutRequested(false)
    } finally {
      startingCheckoutRef.current = false
      setStartingCheckout(false)
    }
  }, [active, billingSubscriptionEnabled, selectedPlanId])

  useEffect(() => {
    if (!active) return
    setCheckoutRequested(false)
    setPlanPromptOpen(false)
    setWaitingGuideFinish(false)
    setVerifyingCheckout(false)
  }, [active])

  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !billingSubscriptionEnabled ||
      subscriptionLoading ||
      !handlingCheckoutReturn
    ) {
      return
    }

    let cancelled = false
    setPlanPromptOpen(false)

    if (subscriptionState === 'canceled') {
      setCheckoutRequested(false)
      router.replace(getPostLoginPath())
      return
    }

    async function syncHostedCheckout() {
      setCheckoutRequested(true)
      setVerifyingCheckout(true)

      for (let attempt = 0; attempt < 12; attempt++) {
        if (cancelled) return

        const payload = await fetchSubscriptionStatus()
        if (payload?.active) {
          await mutateSubscription()
          if (cancelled) return
          router.replace(getPostLoginPath())
          router.refresh()
          setVerifyingCheckout(false)
          setCheckoutRequested(false)
          return
        }

        await wait(1500)
      }

      await mutateSubscription()
      if (cancelled) return
      router.replace(getPostLoginPath())
      router.refresh()
      setVerifyingCheckout(false)
      setCheckoutRequested(false)
    }

    void syncHostedCheckout()

    return () => {
      cancelled = true
    }
  }, [
    billingSubscriptionEnabled,
    handlingCheckoutReturn,
    mutateSubscription,
    router,
    status,
    subscriptionLoading,
    subscriptionState,
  ])

  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !billingSubscriptionEnabled ||
      subscriptionLoading ||
      loadingOnboarding ||
      active ||
      !onboardingCompleted ||
      waitingGuideFinish ||
      checkoutRequested ||
      startingCheckout ||
      planPromptOpen ||
      handlingCheckoutReturn
    ) {
      return
    }

    setPlanPromptOpen(true)
  }, [
    active,
    billingSubscriptionEnabled,
    checkoutRequested,
    handlingCheckoutReturn,
    loadingOnboarding,
    onboardingCompleted,
    planPromptOpen,
    startingCheckout,
    status,
    subscriptionLoading,
    waitingGuideFinish,
  ])

  if (!billingSubscriptionEnabled || status !== 'authenticated') {
    return <>{children}</>
  }

  if (subscriptionLoading || loadingOnboarding) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      {!active && onboardingCompleted && planPromptOpen ? (
        <SubscriptionPlanPrompt
          loading={startingCheckout}
          selectedPlanId={selectedPlanId}
          onSelectPlanId={setSelectedPlanId}
          onContinue={() => void startHostedCheckout()}
        />
      ) : null}
      {!active && onboardingCompleted && (startingCheckout || verifyingCheckout) ? (
        <div className="pointer-events-auto fixed inset-0 z-[10010] bg-slate-950/45 backdrop-blur-[2px]" />
      ) : null}
    </>
  )
}
