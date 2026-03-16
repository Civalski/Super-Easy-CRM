'use client'

import { useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type EmbeddedCheckoutInstance = Awaited<
  ReturnType<import('@stripe/stripe-js').Stripe['initEmbeddedCheckout']>
>

type RegisterEmbeddedCheckoutProps = {
  clientSecret: string
  onComplete?: () => void
  variant?: 'default' | 'compact' | 'bare'
}

export function RegisterEmbeddedCheckout({
  clientSecret,
  onComplete,
  variant = 'default',
}: RegisterEmbeddedCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<EmbeddedCheckoutInstance | null>(null)
  const initSequenceRef = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isBare = variant === 'bare'
  const isCompact = variant === 'compact'
  const frameRadiusClass = isBare
    ? 'rounded-none'
    : isCompact
      ? 'rounded-[24px]'
      : 'rounded-[28px]'
  const frameHeightClass = isBare
    ? 'min-h-dvh [&_iframe]:min-h-dvh'
    : isCompact
      ? 'min-h-[520px] sm:min-h-[580px] lg:min-h-[620px] xl:min-h-[680px] [&_iframe]:min-h-[520px] sm:[&_iframe]:min-h-[580px] lg:[&_iframe]:min-h-[620px] xl:[&_iframe]:min-h-[680px]'
      : 'min-h-[640px] sm:min-h-[700px] lg:min-h-[780px] [&_iframe]:min-h-[640px] sm:[&_iframe]:min-h-[700px] lg:[&_iframe]:min-h-[780px]'
  const frameToneClass = isBare ? 'bg-transparent shadow-none' : 'bg-slate-50 shadow-inner shadow-slate-200/80'

  useEffect(() => {
    const container = containerRef.current
    if (!stripePromise || !clientSecret || !container) return
    const mountContainer = container

    let cancelled = false
    const initSequence = ++initSequenceRef.current

    setError(null)
    setLoading(true)

    async function mountEmbeddedCheckout() {
      const stripe = await stripePromise
      if (!stripe || cancelled) return

      if (checkoutRef.current) {
        checkoutRef.current.destroy()
        checkoutRef.current = null
      }

      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
        onComplete,
      })

      if (cancelled || initSequence !== initSequenceRef.current) {
        checkout.destroy()
        return
      }

      checkoutRef.current = checkout
      mountContainer.innerHTML = ''
      checkout.mount(mountContainer)
      setLoading(false)
    }

    void mountEmbeddedCheckout().catch((err) => {
      setLoading(false)
      setError(err?.message ?? 'Erro ao carregar checkout')
    })

    return () => {
      cancelled = true

      if (checkoutRef.current) {
        checkoutRef.current.destroy()
        checkoutRef.current = null
      }

      mountContainer.innerHTML = ''
    }
  }, [clientSecret, onComplete])

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
        Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para exibir o checkout.
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {loading ? (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm ${frameRadiusClass}`}
        >
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
            Preparando checkout seguro...
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`w-full overflow-hidden [&_iframe]:block [&_iframe]:w-full ${frameRadiusClass} ${frameHeightClass} ${frameToneClass}`}
        aria-label="Checkout Stripe"
      />
    </div>
  )
}
