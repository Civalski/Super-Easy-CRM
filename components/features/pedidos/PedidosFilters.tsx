'use client'

import { useRef, useEffect } from 'react'
import { RotateCcw } from '@/lib/icons'
import { FORMA_PAGAMENTO_OPTIONS } from '@/components/features/oportunidades/constants'
import { STATUS_ENTREGA_LABEL } from './constants'
import type { PedidoTab } from './types'

const STATUS_OPTIONS = [
  { value: '', label: 'Qualquer' },
  { value: 'pendente', label: STATUS_ENTREGA_LABEL.pendente || 'Pendente' },
  { value: 'em_preparacao', label: STATUS_ENTREGA_LABEL.em_preparacao || 'Em preparação' },
  { value: 'enviado', label: STATUS_ENTREGA_LABEL.enviado || 'Enviado' },
  { value: 'entregue', label: STATUS_ENTREGA_LABEL.entregue || 'Entregue' },
]

const PERIODO_OPTIONS = [
  { value: '', label: 'Qualquer período' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
]

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export interface PedidosFiltersValues {
  statusEntrega: string
  formaPagamento: string
  periodo: string
  dataInicio: string
  dataFim: string
}

interface PedidosFiltersProps {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  activeTab: PedidoTab
  values: PedidosFiltersValues
  onClose: () => void
  onChange: (values: PedidosFiltersValues) => void
  onClear: () => void
}

export function PedidosFilters({
  open,
  anchorRef,
  activeTab,
  values,
  onClose,
  onChange,
  onClear,
}: PedidosFiltersProps) {
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

  const showDataFilter = activeTab === 'vendas' || activeTab === 'cancelados'
  const hasActiveFilters =
    Boolean(values.statusEntrega) ||
    Boolean(values.formaPagamento) ||
    Boolean(values.periodo) ||
    (showDataFilter && (Boolean(values.dataInicio) || Boolean(values.dataFim)))

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="space-y-3">
        {!showDataFilter && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Status de entrega
            </label>
            <select
              value={values.statusEntrega}
              onChange={(e) =>
                onChange({ ...values, statusEntrega: e.target.value })
              }
              className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || '_'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
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
        {showDataFilter ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Mês
            </label>
            <div className="flex gap-2">
              <select
                value={
                  values.dataInicio
                    ? String(new Date(values.dataInicio).getMonth() + 1)
                    : String(new Date().getMonth() + 1)
                }
                onChange={(e) => {
                  const mes = parseInt(e.target.value, 10)
                  const ano = values.dataInicio
                    ? new Date(values.dataInicio).getFullYear()
                    : new Date().getFullYear()
                  const firstDay = new Date(ano, mes - 1, 1)
                  const lastDay = new Date(ano, mes, 0)
                  onChange({
                    ...values,
                    dataInicio: firstDay.toISOString().split('T')[0],
                    dataFim: lastDay.toISOString().split('T')[0],
                  })
                }}
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {MESES.map((nome, i) => (
                  <option key={nome} value={String(i + 1)}>
                    {nome}
                  </option>
                ))}
              </select>
              <select
                value={
                  values.dataInicio
                    ? String(new Date(values.dataInicio).getFullYear())
                    : String(new Date().getFullYear())
                }
                onChange={(e) => {
                  const ano = parseInt(e.target.value, 10)
                  const mes = values.dataInicio
                    ? new Date(values.dataInicio).getMonth() + 1
                    : new Date().getMonth() + 1
                  const firstDay = new Date(ano, mes - 1, 1)
                  const lastDay = new Date(ano, mes, 0)
                  onChange({
                    ...values,
                    dataInicio: firstDay.toISOString().split('T')[0],
                    dataFim: lastDay.toISOString().split('T')[0],
                  })
                }}
                className="w-20 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
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
        )}
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
          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
