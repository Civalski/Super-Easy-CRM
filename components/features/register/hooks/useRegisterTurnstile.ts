'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppTheme } from '@/lib/ui/themePreference'
import { getTurnstileTheme } from '@/components/features/login/utils'

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

export function useRegisterTurnstile(
  onError: (message: string) => void,
  theme: AppTheme = 'dark'
) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)
  const [turnstileToken, setTurnstileToken] = useState('')

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
      theme: getTurnstileTheme(theme),
      size: 'normal',
      callback: (token: string) => {
        setTurnstileToken(token)
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'error-callback': () => {
        setTurnstileToken('')
        onError('Confirme a verificacao anti-bot para continuar')
      },
    })

    turnstileWidgetIdRef.current = String(widgetId)
    setTurnstileReady(true)
    return true
  }, [onError, theme, turnstileSiteKey])

  const resetTurnstile = useCallback(() => {
    window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
    setTurnstileToken('')
  }, [])

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

  return {
    renderTurnstile,
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    turnstileToken,
  }
}
