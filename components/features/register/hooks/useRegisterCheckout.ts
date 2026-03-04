'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  INITIAL_REGISTER_FORM,
  REGISTER_COPY,
} from '@/components/features/register/constants'
import type {
  RegisterFormField,
  RegisterFormValues,
  RegisterResponse,
} from '@/components/features/register/types'
import {
  resolveTurnstileToken,
  toRegisterPayload,
  validateRegisterForm,
} from '@/components/features/register/utils'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove?: (widgetId: string) => void
    }
  }
}

export function useRegisterCheckout() {
  const router = useRouter()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [form, setForm] = useState<RegisterFormValues>(INITIAL_REGISTER_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)
  const [turnstileToken, setTurnstileToken] = useState('')

  const updateField = useCallback((field: RegisterFormField, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }, [])

  const renderTurnstile = useCallback(() => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileContainerRef.current) {
      return false
    }

    if (turnstileWidgetIdRef.current && window.turnstile.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current)
      turnstileWidgetIdRef.current = null
    }

    turnstileContainerRef.current.innerHTML = ''
    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
      size: 'normal',
      callback: (token: string) => {
        setTurnstileToken(token)
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'error-callback': () => {
        setTurnstileToken('')
        setError(REGISTER_COPY.turnstileRequired)
      },
    })

    turnstileWidgetIdRef.current = String(widgetId)
    setTurnstileReady(true)
    return true
  }, [turnstileSiteKey])

  useEffect(() => {
    if (!turnstileSiteKey) return

    let attempts = 0
    const maxAttempts = 30
    const interval = window.setInterval(() => {
      attempts += 1
      if (renderTurnstile() || attempts >= maxAttempts) {
        window.clearInterval(interval)
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [renderTurnstile, turnstileSiteKey])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError('')

      const validationError = validateRegisterForm(form)
      if (validationError) {
        setError(validationError)
        return
      }

      const resolvedTurnstileToken = resolveTurnstileToken(turnstileSiteKey, turnstileToken)
      if (turnstileSiteKey && !resolvedTurnstileToken) {
        setError(REGISTER_COPY.turnstileRequired)
        return
      }

      setLoading(true)

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toRegisterPayload(form, resolvedTurnstileToken)),
        })

        const data = (await response.json()) as RegisterResponse
        if (!response.ok || !data.success) {
          setError(data.error || REGISTER_COPY.defaultError)
          window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
          setTurnstileToken('')
          setLoading(false)
          return
        }

        router.push('/login')
      } catch (_error) {
        setError(REGISTER_COPY.defaultError)
        window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
        setTurnstileToken('')
        setLoading(false)
      }
    },
    [form, router, turnstileSiteKey, turnstileToken]
  )

  return {
    error,
    form,
    handleSubmit,
    loading,
    renderTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    updateField,
  }
}
