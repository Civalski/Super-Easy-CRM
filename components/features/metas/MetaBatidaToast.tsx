'use client'

import { Trophy, Sparkles } from '@/lib/icons'
import { toast } from '@/lib/toast'

interface MetaBatidaToastProps {
  metaName?: string
  isMetaDiaria?: boolean
}

/**
 * Exibe um toast de parabéns quando uma meta é batida.
 * Design motivacional com gradiente e ícones celebratórios.
 */
export function showMetaBatidaToast({ metaName, isMetaDiaria }: MetaBatidaToastProps = {}) {
  const title = metaName || (isMetaDiaria ? 'Meta Diária de Contatos' : 'Meta')
  toast.custom(
    (t) => (
      <div
        role="alert"
        className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/90 px-5 py-4 shadow-lg shadow-amber-900/10 dark:border-amber-700/50 dark:from-amber-950/90 dark:via-amber-900/80 dark:to-yellow-900/70"
        onClick={() => toast.dismiss(t)}
      >
        {/* Brilho sutil no canto */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-yellow-400/15 blur-xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-2.5 shadow-md">
            <Trophy className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-amber-900 dark:text-amber-100">
                Parabéns!
              </span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
              Você bateu a meta <span className="font-semibold">{title}</span>!
            </p>
            <p className="mt-1.5 text-xs text-amber-700/80 dark:text-amber-300/80">
              Continue assim, você está arrasando! 🎯
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 6000 }
  )
}
