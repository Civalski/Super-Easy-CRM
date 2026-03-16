'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTurnstileWidget } from '@/components/common/turnstile/useTurnstileWidget'
import type { AppTheme } from '@/lib/ui/themePreference'
import { useGoogleSignIn } from './useGoogleSignIn'
import { getTurnstileTheme, resolveLoginCallbackUrl } from '../utils'

function extractUnconfirmedEmail(errorValue: string | undefined) {
  if (!errorValue) return null

  const normalizedValue = decodeURIComponent(errorValue)
  if (!normalizedValue.startsWith('email_not_confirmed:')) {
    return null
  }

  const email = normalizedValue.slice('email_not_confirmed:'.length).trim().toLowerCase()
  return email || null
}

function getRegisterTokenStorageKey(registerToken: string) {
  return `auth:register-token:${registerToken}`
}

async function waitForSessionUser(maxAttempts = 5, delayMs = 150) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession()
    if (session?.user) {
      return session
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    }
  }

  return null
}

export function useLogin(theme: AppTheme) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('')
  const [pendingLogin, setPendingLogin] = useState(false)
  const [showTurnstilePrompt, setShowTurnstilePrompt] = useState(false)
  const urlError = searchParams.get('error')
  const unconfirmedEmailFromQuery = extractUnconfirmedEmail(urlError ?? undefined)
  const resetSuccess = searchParams.get('reset') === 'success'
  const [error, setError] = useState(() => {
    const msg = urlError
    if (unconfirmedEmailFromQuery) {
      return 'Seu email ainda nao foi confirmado. Reenviamos voce para a tela de confirmacao.'
    }
    if (msg === 'oauth_failed') return 'Login com Google cancelado ou falhou.'
    if (msg === 'oauth_missing_code') return 'Codigo de autorizacao ausente. Tente novamente.'
    if (msg === 'oauth_exchange_failed') return 'Falha ao validar login com Google.'
    if (msg === 'oauth_missing_session') return 'Nao foi possivel concluir a sessao do Google. Tente novamente.'
    if (msg === 'oauth_no_email') return 'Google nao retornou seu email. Verifique as permissoes.'
    if (msg === 'oauth_invalid_token') return 'A sessao retornada pelo Google expirou antes da validacao. Tente novamente.'
    if (msg === 'oauth_user_failed') return 'Nao foi possivel criar ou encontrar sua conta.'
    if (msg === 'oauth_error') return 'Ocorreu um erro ao entrar com Google.'
    return ''
  })
  const [loading, setLoading] = useState(false)
  const callbackUrl = resolveLoginCallbackUrl(searchParams.get('callbackUrl'))
  const {
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    turnstileToken,
  } = useTurnstileWidget({
    action: 'login',
    enabled: showTurnstilePrompt,
    errorMessage: 'Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.',
    onError: setError,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '',
    size: 'flexible',
    theme: getTurnstileTheme(theme),
  })

  const hideTurnstilePrompt = useCallback(() => {
    setPendingLogin(false)
    setShowTurnstilePrompt(false)
    resetTurnstile()
  }, [resetTurnstile])

  const executeLogin = useCallback(async (resolvedTurnstileToken: string) => {
    try {
      const result = await signIn('credentials', {
        callbackUrl,
        password,
        redirect: false,
        turnstileToken: resolvedTurnstileToken,
        username,
        website,
      })

      const unconfirmedEmail = extractUnconfirmedEmail(result?.error ?? undefined)
      if (unconfirmedEmail) {
        router.replace(`/register/check-email?email=${encodeURIComponent(unconfirmedEmail)}&status=error`)
        router.refresh()
        return
      }

      if (!result?.ok || result.error) {
        setError('Falha na autenticacao. Verifique os dados e tente novamente.')
        hideTurnstilePrompt()
        setLoading(false)
        return
      }

      const session = await waitForSessionUser()
      if (!session?.user) {
        setError(
          'Login validado, mas a sessao nao foi criada. Verifique NEXTAUTH_URL e NEXTAUTH_SECRET no deploy.'
        )
        hideTurnstilePrompt()
        setLoading(false)
        return
      }

      hideTurnstilePrompt()
      if (typeof window !== 'undefined') {
        window.location.replace(callbackUrl)
        return
      }
      router.replace(callbackUrl)
      router.refresh()
    } catch (_error) {
      setError('Ocorreu um erro ao tentar fazer login')
      hideTurnstilePrompt()
      setLoading(false)
    }
  }, [callbackUrl, hideTurnstilePrompt, password, router, username, website])

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
    setError('')

    if (turnstileSiteKey && !turnstileToken) {
      setPendingLogin(true)
      setShowTurnstilePrompt(true)
      setError(
        turnstileReady
          ? 'Confirme a verificacao anti-bot para continuar.'
          : 'A verificacao anti-bot esta sendo preparada. Aguarde um instante.'
      )
      return
    }

    setLoading(true)
    await executeLogin(turnstileToken)
  }

  useEffect(() => {
    if (!pendingLogin || !turnstileToken) return

    setPendingLogin(false)
    setLoading(true)
    setError('')
    void executeLogin(turnstileToken)
  }, [executeLogin, pendingLogin, turnstileToken])

  const registerToken = searchParams.get('register_token')
  const urlCallbackUrl = searchParams.get('callbackUrl')

  useEffect(() => {
    if (!registerToken) return

    let cancelled = false
    const doAutoSignIn = async () => {
      const storageKey = getRegisterTokenStorageKey(registerToken)

      try {
        if (typeof window !== 'undefined') {
          const handledState = window.sessionStorage.getItem(storageKey)
          if (handledState === 'processing' || handledState === 'done') {
            return
          }
          window.sessionStorage.setItem(storageKey, 'processing')
        }

        const result = await signIn('credentials', {
          callbackUrl: urlCallbackUrl || callbackUrl,
          redirect: false,
          registerToken,
          username: '',
          password: '',
        })
        if (cancelled) return
        if (result?.ok && !result.error) {
          const session = await waitForSessionUser()
          if (session?.user) {
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem(storageKey, 'done')
              window.location.replace(urlCallbackUrl || callbackUrl)
              return
            }
            router.replace(urlCallbackUrl || callbackUrl)
            router.refresh()
            return
          }
        }
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(storageKey)
        }
        setError('Token de login expirado ou invalido. Tente novamente.')
      } catch {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(storageKey)
        }
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
    setPassword,
    setUsername,
    setWebsite,
    showTurnstilePrompt,
    showGoogleSignIn,
    hideTurnstilePrompt,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    username,
    website,
  }
}
