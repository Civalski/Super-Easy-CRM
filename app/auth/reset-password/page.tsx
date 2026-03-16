'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/common'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  const verifyRecovery = useCallback(async () => {
    if (!code && !(tokenHash && type === 'recovery')) {
      setVerifying(false)
      setError('Link invalido ou expirado. Solicite um novo link de redefinicao.')
      return
    }

    try {
      const supabase = createSupabaseBrowserClient()

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError
      } else if (tokenHash && type === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (verifyError) throw verifyError
      }

      setVerified(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Link invalido ou expirado.'
      setError(msg)
    } finally {
      setVerifying(false)
    }
  }, [code, tokenHash, type])

  useEffect(() => {
    verifyRecovery()
  }, [verifyRecovery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (accessToken) {
        const res = await fetch('/api/auth/sync-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ password }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.warn('Sync Prisma password failed:', data)
        }
      }

      router.replace('/login?reset=success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nao foi possivel alterar a senha.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
        <div className="text-slate-400">Verificando link...</div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-600/70 bg-slate-800/65 p-6">
          <h1 className="mb-4 text-lg font-semibold text-slate-200">Link invalido</h1>
          <p className="mb-6 text-sm text-slate-400">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="mb-8 flex justify-center">
        <Image
          src="/arker10.png"
          alt="Arker CRM"
          width={180}
          height={48}
          className="h-10 w-auto object-contain"
        />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-600/70 bg-slate-800/65 p-6">
        <h1 className="mb-2 text-lg font-semibold text-slate-200">Nova senha</h1>
        <p className="mb-6 text-sm text-slate-400">
          Digite sua nova senha abaixo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-slate-200">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="h-12 w-full">
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
