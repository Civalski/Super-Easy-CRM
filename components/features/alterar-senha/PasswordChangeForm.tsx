'use client'

import { Button } from '@/components/common'
import type { PasswordFormMode, PasswordFormValues } from './types'

type PasswordChangeFormProps = {
  error: string
  info?: string
  loading: boolean
  mode: PasswordFormMode
  onChange: (field: keyof PasswordFormValues, value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> | void
  submitLabel: string
  values: PasswordFormValues
}

export function PasswordChangeForm({
  error,
  info,
  loading,
  mode,
  onChange,
  onSubmit,
  submitLabel,
  values,
}: PasswordChangeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'authenticated' ? (
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="text-sm font-medium text-slate-200">
            Senha atual
          </label>
          <input
            id="current-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="********"
            value={values.currentPassword}
            onChange={(event) => onChange('currentPassword', event.target.value)}
            className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-slate-200">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="********"
          value={values.newPassword}
          onChange={(event) => onChange('newPassword', event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-200">
          Confirmar nova senha
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="********"
          value={values.confirmPassword}
          onChange={(event) => onChange('confirmPassword', event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 text-sm text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
        />
      </div>

      {info ? (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {info}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={loading} className="h-12 w-full">
        {loading ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
