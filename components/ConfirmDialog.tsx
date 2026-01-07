'use client'

import Button from '@/components/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'danger'
  confirmLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? 'Processando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
