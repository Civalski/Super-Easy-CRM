'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, ShieldCheck } from '@/lib/icons'

export function AcessoContaCard() {
  const router = useRouter()

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Alterar senha do usuário</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/alterar-senha')}
          className="shrink-0 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
        >
          Alterar senha
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
