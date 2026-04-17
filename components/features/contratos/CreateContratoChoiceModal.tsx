'use client'

import { SideCreateDrawer } from '@/components/common'
import { FileText, Sparkles, X } from '@/lib/icons'

interface CreateContratoChoiceModalProps {
  open: boolean
  onClose: () => void
  onSelect: (mode: 'manual' | 'ia') => void
  variant?: 'contrato' | 'proposta'
}

export function CreateContratoChoiceModal({
  open,
  onClose,
  onSelect,
  variant = 'contrato',
}: CreateContratoChoiceModalProps) {
  const isProposta = variant === 'proposta'
  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isProposta ? 'Nova proposta de serviço' : 'Novo contrato'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isProposta
                ? 'Escolha como deseja montar a proposta comercial (sem cláusulas contratuais).'
                : 'Escolha como deseja iniciar a criacao do contrato.'}
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

        <div className="flex-1 p-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onSelect('manual')}
              className="flex w-full items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <div className="rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Gerar manualmente</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Abrir formulario completo manual</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect('ia')}
              className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Gerar com I.A</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Abrir fluxo dedicado com recursos de IA</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
