/**
 * Card de suporte com links de contato (WhatsApp, Instagram, e-mail).
 */
'use client'

import { MessageCircle, Instagram, Mail } from '@/lib/icons'

export function SuporteCard() {
  return (
    <div className="crm-card p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Suporte</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Entre em contato por WhatsApp, Instagram ou e-mail para reportar problemas, sugestões ou dúvidas.
          </p>
          <div className="space-y-2">
            <a
              href="https://wa.me/5519998205608?text=Ol%C3%A1%2C%20gostaria%20de%20reportar%20um%20problema%2C%20sugest%C3%A3o%20ou%20d%C3%BAvida"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium">WhatsApp</span>
            </a>
            <a
              href="https://ig.me/m/arkersoft"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
            >
              <Instagram className="h-4 w-4 shrink-0 text-pink-600 dark:text-pink-400" />
              <span className="text-xs font-medium">Instagram (Direct)</span>
            </a>
            <a
              href="mailto:arkersoft@gmail.com"
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
            >
              <Mail className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium">arkersoft@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
