'use client'

import { useRef, useEffect } from 'react'
import { RotateCcw } from '@/lib/icons'
import { FORMA_PAGAMENTO_OPTIONS } from './constants'

const PROBABILIDADE_OPTIONS = [
  { value: '', label: 'Qualquer' },
  { value: 'baixa', label: 'Baixa (0-33%)' },
  { value: 'media', label: 'Média (34-66%)' },
  { value: 'alta', label: 'Alta (67-100%)' },
]

const PERIODO_OPTIONS = [
  { value: '', label: 'Qualquer período' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
]

export interface OrcamentosFiltersValues {
  formaPagamento: string
  probabilidade: string
  periodo: string
}

interface OrcamentosFiltersProps {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  values: OrcamentosFiltersValues
  onClose: () => void
  onChange: (values: OrcamentosFiltersValues) => void
  onClear: () => void
}

export function OrcamentosFilters({
  open,
  anchorRef,
  values,
  onClose,
  onChange,
  onClear,
}: OrcamentosFiltersProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, anchorRef, onClose])

  const hasActiveFilters =
    Boolean(values.formaPagamento) ||
    Boolean(values.probabilidade) ||
    Boolean(values.periodo)

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Forma de pagamento
          </label>
          <select
            value={values.formaPagamento}
            onChange={(e) =>
              onChange({ ...values, formaPagamento: e.target.value })
            }
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Qualquer</option>
            {FORMA_PAGAMENTO_OPTIONS.filter((o) => o.value !== '').map(
              (opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Probabilidade
          </label>
          <select
            value={values.probabilidade}
            onChange={(e) =>
              onChange({ ...values, probabilidade: e.target.value })
            }
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {PROBABILIDADE_OPTIONS.map((opt) => (
              <option key={opt.value || '_'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Criado em
          </label>
          <select
            value={values.periodo}
            onChange={(e) => onChange({ ...values, periodo: e.target.value })}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {PERIODO_OPTIONS.map((opt) => (
              <option key={opt.value || '_'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RotateCcw size={14} />
            Limpar filtros
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
