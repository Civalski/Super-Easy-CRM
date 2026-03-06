'use client'

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
            const isInitial = choice === initialChoice
            const bg = choice === 'pagamento' ? 'bg-blue-600 hover:bg-blue-700' : choice === 'entrega' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-green-600 hover:bg-green-700'
            return (
              <button
                key={choice}
                type="button"
                onClick={() => onConfirm(choice)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${bg} ${isInitial ? 'ring-2 ring-white/40' : ''}`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
