'use client'

import type { ReactNode } from 'react'
import { Button, SideCreateDrawer } from '@/components/common'
import { X } from '@/lib/icons'

interface ContratoFormDrawerProps {
  open: boolean
  title: string
  description: string
  primaryLabel: string
  primaryDisabled?: boolean
  primaryLoading?: boolean
  onClose: () => void
  onSubmit: () => void
  onBack?: () => void
  children: ReactNode
}

export function ContratoFormDrawer({
  open,
  title,
  description,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  onClose,
  onSubmit,
  onBack,
  children,
}: ContratoFormDrawerProps) {
  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
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

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={primaryDisabled}>
            {primaryLoading ? 'Salvando...' : primaryLabel}
          </Button>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
