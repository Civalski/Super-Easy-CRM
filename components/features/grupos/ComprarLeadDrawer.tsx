'use client'

import { X, Building2, CheckCircle2, Upload, MessageCircle } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'

export interface ComprarLeadDrawerProps {
  open: boolean
  onClose: () => void
  onImportClick?: () => void
}

export function ComprarLeadDrawer({ open, onClose, onImportClick }: ComprarLeadDrawerProps) {
  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comprar lead</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Leads qualificados para prospecção B2B
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
            <Building2 size={20} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-200">
                Leads para empresas B2B
              </p>
              <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                Os leads são direcionados para empresas que vendem para outras empresas (B2B — Business to Business), permitindo prospecção focada no seu público-alvo.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Análise — R$ 149,90
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Investimento único que inclui:
              </p>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>1.500 leads</strong> específicos para o seu negócio
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Planejamento estratégico</strong> de prospecção
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Pós-análise</strong> após execução do planejamento estratégico
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Infraestrutura completa</strong> de prospecção dos leads com o Arker CRM
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Leads reais validados</strong>
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Resultado garantido</strong> ou seu dinheiro de volta
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Quer realizar a análise?
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://wa.me/5519998205608?text=Ol%C3%A1%2C%20eu%20gostaria%20de%20realizar%20um%20planejamento%20de%20prospec%C3%A7%C3%A3o%20automatizada"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors"
              >
                <MessageCircle size={16} />
                Realizar análise
              </a>
              {onImportClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onImportClick()
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-300 dark:border-sky-600 bg-sky-50 dark:bg-sky-900/30 px-3 py-2 text-sm font-medium text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-800 transition-colors"
                >
                  <Upload size={16} />
                  Importar arquivo CSV
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
