'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          action?: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          sitekey: string
          size?: 'normal' | 'compact' | 'flexible'
          theme?: 'light' | 'dark' | 'auto'
          'timeout-callback'?: () => void
        }
      ) => string
      remove?: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
  }
}

type UseTurnstileWidgetOptions = {
  action?: string
  enabled?: boolean
  errorMessage?: string
  maxAttempts?: number
  onError?: (message: string) => void
  retryIntervalMs?: number
  siteKey?: string
  size?: 'normal' | 'compact' | 'flexible'
  theme?: 'light' | 'dark' | 'auto'
}

export function useTurnstileWidget({
  action,
  enabled = true,
  errorMessage = 'Nao foi possivel validar a verificacao anti-bot. Tente novamente.',
  maxAttempts = 30,
  onError,
  retryIntervalMs = 250,
  siteKey = '',
  size = 'normal',
  theme = 'auto',
}: UseTurnstileWidgetOptions) {
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [turnstileReady, setTurnstileReady] = useState(!siteKey || !enabled)
  const [turnstileToken, setTurnstileToken] = useState('')

  const renderTurnstile = useCallback(() => {
    if (!siteKey || !window.turnstile || !turnstileContainerRef.current) {
      return false
    }

    if (turnstileWidgetIdRef.current && window.turnstile.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current)
      turnstileWidgetIdRef.current = null
    }

    turnstileContainerRef.current.innerHTML = ''
    setTurnstileReady(false)

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      action,
      sitekey: siteKey,
      size,
      theme,
      callback: (token: string) => {
        setTurnstileToken(token)
      },
      'error-callback': () => {
        setTurnstileToken('')
        onError?.(errorMessage)
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'timeout-callback': () => {
        setTurnstileToken('')
        onError?.('A verificacao anti-bot expirou. Confirme novamente.')
      },
    })

    turnstileWidgetIdRef.current = String(widgetId)
    setTurnstileReady(true)
    return true
  }, [action, errorMessage, onError, siteKey, size, theme])

  const resetTurnstile = useCallback(() => {
    window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
    setTurnstileToken('')
  }, [])

  useEffect(() => {
    if (!siteKey || !enabled) return

    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      if (renderTurnstile() || attempts >= maxAttempts) {
        window.clearInterval(interval)
      }
    }, retryIntervalMs)

    return () => window.clearInterval(interval)
  }, [enabled, maxAttempts, renderTurnstile, retryIntervalMs, siteKey])

  useEffect(() => {
    if (enabled) return

    if (turnstileWidgetIdRef.current && window.turnstile?.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current)
      turnstileWidgetIdRef.current = null
    }

    setTurnstileToken('')
    setTurnstileReady(!siteKey || !enabled)
  }, [enabled, siteKey])

  useEffect(
    () => () => {
      if (turnstileWidgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current)
      }
    },
    []
  )

  return {
    renderTurnstile,
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey: siteKey,
    turnstileToken,
  }
}
