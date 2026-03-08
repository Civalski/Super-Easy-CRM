'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import ConfirmDialog from './ConfirmDialog'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'secondary' | 'outline-solid' | 'danger'
}

export interface PromptOptions {
  title: string
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  prompt: (opts: PromptOptions) => Promise<string | null>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider')
  return ctx
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [dialog, setDialog] = useState<{
    type: 'confirm' | 'prompt'
    title: string
    description?: string
    label?: string
    placeholder?: string
    defaultValue?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: 'primary' | 'secondary' | 'outline-solid' | 'danger'
    resolve: (value: boolean | string | null) => void
  } | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const [loading, setLoading] = useState(false)

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        type: 'confirm',
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        confirmVariant: opts.confirmVariant ?? 'danger',
        resolve: (v) => resolve(v === true),
      })
      setPromptValue('')
    })
  }, [])

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialog({
        type: 'prompt',
        title: opts.title,
        label: opts.label,
        placeholder: opts.placeholder,
        defaultValue: opts.defaultValue ?? '',
        confirmLabel: opts.confirmLabel ?? 'Confirmar',
        cancelLabel: opts.cancelLabel ?? 'Cancelar',
        confirmVariant: 'primary',
        resolve: (v) => resolve(typeof v === 'string' ? v : null),
      })
      setPromptValue(opts.defaultValue ?? '')
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (!dialog) return
    if (dialog.type === 'prompt') {
      dialog.resolve(promptValue)
    } else {
      dialog.resolve(true)
    }
    setDialog(null)
    setPromptValue('')
    setLoading(false)
  }, [dialog, promptValue])

  const handleCancel = useCallback(() => {
    if (!dialog) return
    dialog.resolve(dialog.type === 'prompt' ? null : false)
    setDialog(null)
    setPromptValue('')
    setLoading(false)
  }, [dialog])

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog?.type === 'confirm' && (
        <ConfirmDialog
          open
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          confirmVariant={dialog.confirmVariant}
          confirmLoading={loading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {dialog?.type === 'prompt' && (
        <PromptDialog
          open
          title={dialog.title}
          label={dialog.label}
          placeholder={dialog.placeholder}
          value={promptValue}
          onChange={setPromptValue}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  )
}

interface PromptDialogProps {
  open: boolean
  title: string
  label?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

function PromptDialog({
  open,
  title,
  label,
  placeholder,
  value,
  onChange,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {label && (
          <label className="mt-3 block text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </label>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
          }}
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-purple-600 bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
