'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AppTheme } from '@/lib/ui/themePreference'
import { useGoogleSignIn } from './useGoogleSignIn'
import { TURNSTILE_RETRY_INTERVAL_MS, TURNSTILE_RETRY_MAX_ATTEMPTS } from '../constants'
import { getTurnstileTheme, resolveLoginCallbackUrl } from '../utils'

export function useLogin(theme: AppTheme) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReady, setTurnstileReady] = useState(!turnstileSiteKey)
  const urlError = searchParams.get('error')
  const resetSuccess = searchParams.get('reset') === 'success'
  const [error, setError] = useState(() => {
    const msg = urlError
    if (msg === 'oauth_failed') return 'Login com Google cancelado ou falhou.'
    if (msg === 'oauth_missing_code') return 'Codigo de autorizacao ausente. Tente novamente.'
    if (msg === 'oauth_exchange_failed') return 'Falha ao validar login com Google.'
    if (msg === 'oauth_no_email') return 'Google nao retornou seu email. Verifique as permissoes.'
    if (msg === 'oauth_user_failed') return 'Nao foi possivel criar ou encontrar sua conta.'
    if (msg === 'oauth_error') return 'Ocorreu um erro ao entrar com Google.'
    return ''
  })
  const [loading, setLoading] = useState(false)
  const callbackUrl = resolveLoginCallbackUrl(searchParams.get('callbackUrl'))
  const turnstileTheme = getTurnstileTheme(theme)

  const resetTurnstile = useCallback(() => {
    window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined)
    setTurnstileToken('')
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
    setTurnstileReady(false)

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: turnstileTheme,
      size: 'normal',
      callback: (token: string) => {
        setTurnstileToken(token)
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'error-callback': () => {
        setTurnstileToken('')
        setError('Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.')
      },
    })

    turnstileWidgetIdRef.current = String(widgetId)
    setTurnstileReady(true)
    return true
  }, [turnstileSiteKey, turnstileTheme])

  useEffect(() => {
    if (!turnstileSiteKey) return

    let attempts = 0
    const interval = window.setInterval(() => {
      attempts += 1
      if (renderTurnstile() || attempts >= TURNSTILE_RETRY_MAX_ATTEMPTS) {
        window.clearInterval(interval)
      }
    }, TURNSTILE_RETRY_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [renderTurnstile, turnstileSiteKey])

  const { handleGoogleSignIn: baseGoogleSignIn, showGoogleSignIn } = useGoogleSignIn(
    callbackUrl,
    (msg) => {
      setError(msg)
      setLoading(false)
    }
  )
  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    setError('')
    await baseGoogleSignIn()
  }, [baseGoogleSignIn])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const resolvedTurnstileToken =
      turnstileToken ||
      (turnstileSiteKey
        ? (
            document.querySelector('input[name="cf-turnstile-response"]') as
              | HTMLInputElement
              | null
          )
            ?.value?.trim() ?? ''
        : '')

    if (turnstileSiteKey && !resolvedTurnstileToken) {
      setError('Confirme a verificacao anti-bot para continuar')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        callbackUrl,
        password,
        redirect: false,
        turnstileToken: resolvedTurnstileToken,
        username,
        website,
      })

      if (!result?.ok || result.error) {
        setError('Falha na autenticacao. Verifique os dados e tente novamente.')
        resetTurnstile()
        setLoading(false)
        return
      }

      const session = await getSession()
      if (!session?.user) {
        setError(
          'Login validado, mas a sessao nao foi criada. Verifique NEXTAUTH_URL e NEXTAUTH_SECRET no deploy.'
        )
        setLoading(false)
        return
      }

      router.replace(callbackUrl)
      router.refresh()
    } catch (_error) {
      setError('Ocorreu um erro ao tentar fazer login')
      resetTurnstile()
      setLoading(false)
    }
  }

  const registerToken = searchParams.get('register_token')
  const urlCallbackUrl = searchParams.get('callbackUrl')

  useEffect(() => {
    if (!registerToken) return

    let cancelled = false
    const doAutoSignIn = async () => {
      try {
        const result = await signIn('credentials', {
          callbackUrl: urlCallbackUrl || callbackUrl,
          redirect: false,
          registerToken,
          username: '',
          password: '',
        })
        if (cancelled) return
        if (result?.ok && !result.error) {
          const session = await getSession()
          if (session?.user) {
            router.replace(urlCallbackUrl || callbackUrl)
            router.refresh()
            return
          }
        }
        setError('Token de login expirado ou invalido. Tente novamente.')
      } catch {
        if (!cancelled) setError('Ocorreu um erro ao concluir o login.')
      }
    }
    doAutoSignIn()
    return () => {
      cancelled = true
    }
  }, [registerToken, urlCallbackUrl, callbackUrl, router])

  return {
    error,
    handleGoogleSignIn,
    resetSuccess,
    handleSubmit,
    loading,
    password,
    renderTurnstile,
    setPassword,
    setUsername,
    setWebsite,
    showGoogleSignIn,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    username,
    website,
  }
}
