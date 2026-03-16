'use client'

import { useState } from 'react'
import type { PasswordFormValues } from '../types'
import { validatePasswordForm } from '../utils'

const INITIAL_VALUES: PasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function useAuthenticatedPasswordChange() {
  const [values, setValues] = useState<PasswordFormValues>(INITIAL_VALUES)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const setField = (field: keyof PasswordFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validatePasswordForm(values, true)
    if (validationError) {
      setError(validationError)
      setInfo('')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !data.success) {
        setError(data.error ?? 'Nao foi possivel alterar a senha.')
        return
      }

      setValues(INITIAL_VALUES)
      setInfo('Senha alterada com sucesso.')
    } catch {
      setError('Ocorreu um erro ao alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return {
    error,
    info,
    loading,
    setField,
    values,
    handleSubmit,
  }
}
