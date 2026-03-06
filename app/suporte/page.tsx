'use client'

import { LifeBuoy, Mail, MessageCircle } from '@/lib/icons'

export default function SuportePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 p-2.5 shadow-lg shadow-indigo-500/25">
          <LifeBuoy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suporte</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Canais de atendimento para ajuda com o CRM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="crm-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">E-mail</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Envie detalhes do problema para:
          </p>
          <a
            href="mailto:arkersoft@gmail.com"
            className="mt-2 inline-flex text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300"
          >
            arkersoft@gmail.com
          </a>
        </section>

        <section className="crm-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Atendimento rapido para duvidas e suporte operacional.
          </p>
          <a
            href="https://wa.me/5519998205608"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
          >
            Abrir conversa
          </a>
        </section>
      </div>
    </div>
  )
}
