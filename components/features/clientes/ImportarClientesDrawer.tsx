'use client'

import { X, Upload } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'

interface ImportarClientesDrawerProps {
  open: boolean
  onClose: () => void
  onImportClick?: () => void
}

export function ImportarClientesDrawer({ open, onClose, onImportClick }: ImportarClientesDrawerProps) {
  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Importar clientes</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Importa para leads do funil e converte automaticamente em clientes
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
            <p className="text-sm text-sky-800 dark:text-sky-200">
              O CSV e importado para os leads do funil e cada lead e convertido em cliente. Use o
              mesmo formato do funil: CNPJ, Razao Social, Nome Fantasia, Municipio, UF, Telefone, Email, etc.
            </p>
          </div>

          <div className="mt-6">
            {onImportClick && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onImportClick()
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 shadow-xs transition-colors hover:bg-sky-100 dark:border-sky-600 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-800"
              >
                <Upload size={18} />
                Importar arquivo CSV
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
