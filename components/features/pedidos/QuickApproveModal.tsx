'use client'

import { Button } from '@/components/common'
import type { Pedido, QuickApproveChoice } from './types'
import { QUICK_APPROVE_OPTIONS, STATUS_ENTREGA_LABEL } from './constants'

interface QuickApproveModalProps {
  pedido: Pedido
  initialChoice: QuickApproveChoice
  onConfirm: (choice: QuickApproveChoice) => void
  onCancel: () => void
}

export function QuickApproveModal({ pedido, initialChoice, onConfirm, onCancel }: QuickApproveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aprovar pedido #{pedido.numero}
        </h3>
        <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <div><strong>Status entrega:</strong> {STATUS_ENTREGA_LABEL[pedido.statusEntrega] || 'Pendente'}</div>
          <div><strong>Pagamento:</strong> {pedido.pagamentoConfirmado ? 'Confirmado' : 'Pendente'}</div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {(Object.entries(QUICK_APPROVE_OPTIONS) as Array<[QuickApproveChoice, string]>).map(([choice, label]) => {
            const choiceStyle =
              choice === 'pagamento'
                ? 'border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                : choice === 'entrega'
                  ? 'border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-800'
                  : 'border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800'
            return (
              <button
                key={choice}
                type="button"
                onClick={() => onConfirm(choice)}
                className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-base font-medium shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${choiceStyle}`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
