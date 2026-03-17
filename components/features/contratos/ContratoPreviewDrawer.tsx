'use client'

import { X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import type { Contrato } from './types'

interface ContratoPreviewDrawerProps {
  open: boolean
  contrato: Contrato | null
  onClose: () => void
}

export function ContratoPreviewDrawer({
  open,
  contrato,
  onClose,
}: ContratoPreviewDrawerProps) {
  if (!contrato) return null

  const pdfUrl = `/api/contratos/${contrato.id}/pdf?preview=1`
  const docNum = String(contrato.numero).padStart(5, '0')

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Preview do contrato #{docNum}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{contrato.titulo}</p>
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

        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
          <iframe
            src={open ? pdfUrl : undefined}
            title={`Preview contrato ${docNum}`}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </SideCreateDrawer>
  )
}
