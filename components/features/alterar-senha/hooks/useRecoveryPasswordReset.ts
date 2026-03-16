'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSupabaseBrowserClient,
  getSupabaseBrowserAccessToken,
} from '@/lib/supabase/client'
import type { PasswordFormValues } from '../types'
import { validatePasswordForm } from '../utils'

const INITIAL_VALUES: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

type RecoveryParams = {
  code: string | null
  tokenHash: string | null
  type: string | null
}

export function useRecoveryPasswordReset({
  code,
  tokenHash,
  type,
}: RecoveryParams) {
  const router = useRouter()
  const [values, setValues] = useState<PasswordFormValues>(INITIAL_VALUES)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(Boolean(code || tokenHash))
  const [verified, setVerified] = useState(false)

  const hasRecoveryToken = Boolean(code || (tokenHash && type === 'recovery'))

  const setField = (field: keyof PasswordFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const verifyRecovery = useCallback(async () => {
    if (!hasRecoveryToken) {
      setVerifying(false)
      setVerified(false)
      return
    }

    try {
      if (code) {
        const { accessToken } = await getSupabaseBrowserAccessToken()
        setAccessToken(accessToken)
      } else if (tokenHash && type === 'recovery') {
        const supabase = createSupabaseBrowserClient()
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })

        if (verifyError) throw verifyError
        setAccessToken(data.session?.access_token ?? null)
      }

      setVerified(true)
      setError('')
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Link invalido ou expirado. Solicite um novo link de redefinicao.'

      setVerified(false)
      setError(message)
    } finally {
      setVerifying(false)
    }
  }, [code, hasRecoveryToken, tokenHash, type])

  useEffect(() => {
    void verifyRecovery()
  }, [verifyRecovery])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validatePasswordForm(values, false)
    if (validationError) {
      setError(validationError)
      setInfo('')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      })

      if (updateError) {
        throw updateError
      }

      const response = await fetch('/api/auth/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ password: values.newPassword }),
      })

      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Nao foi possivel sincronizar a nova senha.')
      }

      await supabase.auth.signOut()
      router.replace('/login?reset=success')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Nao foi possivel alterar a senha.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    error,
    hasRecoveryToken,
    info,
    loading,
    setField,
    values,
    verified,
    verifying,
    handleSubmit,
  }
}
