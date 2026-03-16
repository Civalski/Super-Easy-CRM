'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTurnstileWidget } from '@/components/common/turnstile/useTurnstileWidget'
import { validateResetEmail } from '../utils'

export function useResetPasswordRequest(initialInfo = '') {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(initialInfo)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [showTurnstilePrompt, setShowTurnstilePrompt] = useState(false)
  const {
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    turnstileToken,
  } = useTurnstileWidget({
    action: 'forgot_password',
    enabled: showTurnstilePrompt,
    errorMessage: 'Nao foi possivel carregar a verificacao anti-bot. Recarregue a pagina.',
    onError: setError,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '',
    size: 'flexible',
    theme: 'dark',
  })

  useEffect(() => {
    if (!success) {
      setInfo(initialInfo)
    }
  }, [initialInfo, success])

  const hideTurnstilePrompt = useCallback(() => {
    setPendingSubmit(false)
    setShowTurnstilePrompt(false)
    resetTurnstile()
  }, [resetTurnstile])

  const submitResetRequest = useCallback(async (resolvedEmail: string) => {
    setLoading(true)
    setError('')
    setInfo(initialInfo)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resolvedEmail,
          turnstileToken,
          website,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !data.success) {
        hideTurnstilePrompt()
        setError(data.error ?? 'Nao foi possivel enviar o email. Tente novamente.')
        return
      }

      setSuccess(true)
      setInfo('Se existir uma conta com esse email, voce recebera um link para redefinir sua senha.')
      hideTurnstilePrompt()
    } catch {
      hideTurnstilePrompt()
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [hideTurnstilePrompt, initialInfo, turnstileToken, website])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validation = validateResetEmail(email)
    if (validation.error) {
      setError(validation.error)
      return
    }

    if (turnstileSiteKey && !turnstileToken) {
      setPendingSubmit(true)
      setShowTurnstilePrompt(true)
      setError(
        turnstileReady
          ? 'Confirme a verificacao anti-bot para enviar o link.'
          : 'A verificacao anti-bot esta sendo preparada. Aguarde um instante.'
      )
      return
    }

    await submitResetRequest(validation.email)
  }

  useEffect(() => {
    if (!pendingSubmit || !turnstileToken) return

    const validation = validateResetEmail(email)
    if (validation.error) {
      hideTurnstilePrompt()
      setError(validation.error)
      return
    }

    setPendingSubmit(false)
    void submitResetRequest(validation.email)
  }, [email, hideTurnstilePrompt, pendingSubmit, submitResetRequest, turnstileToken])

  return {
    email,
    error,
    info,
    loading,
    setEmail,
    setWebsite,
    success,
    handleSubmit,
    hideTurnstilePrompt,
    showTurnstilePrompt,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    website,
  }
}
