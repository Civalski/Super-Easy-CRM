/**
 * Card que linka para a página de privacidade e tratamento de dados (site Arkersoft).
 */
'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowRight } from '@/lib/icons'

const PRIVACIDADE_URL = 'https://arkersoft.vercel.app/seusdados'

export function PrivacidadeCard() {
  return (
    <Link
      href={PRIVACIDADE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="crm-card flex items-center gap-3 p-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
    >
      <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Como seus dados são tratados?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Segurança, LGPD e boas práticas da Arkersoft.
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
    </Link>
  )
}
