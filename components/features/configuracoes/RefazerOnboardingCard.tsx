/**
 * Opção para refazer a configuração inicial (onboarding).
 * Apaga os dados antigos e exibe o wizard novamente.
 */
'use client'

import { useState } from 'react'
import { RotateCcw, Loader2 } from '@/lib/icons'

export function RefazerOnboardingCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefazer = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/me/onboarding', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao resetar')
      }
      window.dispatchEvent(new CustomEvent('arker:onboarding-reset', { detail: { refazer: true } }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao refazer configuração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <RotateCcw className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Configuração inicial</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Refazer área de atuação, dados do PDF, tema e menu
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleRefazer}
            disabled={loading}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                <span className="ml-1.5">Refazendo…</span>
              </>
            ) : (
              'Refazer'
            )}
          </button>
          {error && (
            <span className="text-[10px] text-red-500 dark:text-red-400">{error}</span>
          )}
        </div>
      </div>
    </div>
  )
}
