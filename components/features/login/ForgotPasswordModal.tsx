'use client'

import { useState } from 'react'
import { Button } from '@/components/common'
import { QuestionMarkCircle, X } from '@/lib/icons'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { LoginThemeAppearance } from './types'

type ForgotPasswordModalProps = {
  appearance: LoginThemeAppearance
  onClose: () => void
}

export function ForgotPasswordModal({ appearance, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Informe seu email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Email invalido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        useSupabase?: boolean
        error?: string
      }

      if (data.success && data.useSupabase) {
        let supabase
        try {
          supabase = createSupabaseBrowserClient()
        } catch {
          setError('Recuperacao de senha nao configurada. Entre em contato com o suporte.')
          setLoading(false)
          return
        }
        const redirectTo = `${window.location.origin}/auth/reset-password`
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo,
        })
        if (resetError) {
          setError(resetError.message ?? 'Nao foi possivel enviar o email. Tente novamente.')
          setLoading(false)
          return
        }
      } else if (!res.ok || !data.success) {
        setError(data.error ?? 'Nao foi possivel enviar o email. Tente novamente.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
        <div
          className={`relative z-10 w-full max-w-md rounded-2xl border p-6 ${appearance.formCard}`}
          role="dialog"
          aria-labelledby="forgot-success-title"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-1 transition ${appearance.link}`}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
          <h2 id="forgot-success-title" className={`mb-2 text-lg font-semibold ${appearance.label}`}>
            Email enviado
          </h2>
          <p className={`mb-6 text-sm ${appearance.helperText}`}>
            Se existir uma conta com esse email, voce recebera um link para redefinir sua senha.
            Verifique tambem a pasta de spam.
          </p>
          <Button type="button" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border p-6 ${appearance.formCard}`}
        role="dialog"
        aria-labelledby="forgot-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="forgot-title" className={`flex items-center gap-2 text-lg font-semibold ${appearance.label}`}>
            <QuestionMarkCircle size={20} />
            Esqueci minha senha
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1 transition ${appearance.link}`}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <p className={`mb-4 text-sm ${appearance.helperText}`}>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className={`text-sm font-medium ${appearance.label}`}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 w-full rounded-xl border px-4 text-sm outline-hidden transition ${appearance.input}`}
            />
          </div>

          {error && (
            <div className={`rounded-xl border px-3 py-2 text-sm ${appearance.errorBox}`}>
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Enviando...' : 'Enviar link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
