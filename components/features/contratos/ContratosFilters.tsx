'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/common'
import { TIPOS_CONTRATO } from './constants'

export interface ContratosFiltersValues {
  tipo: string
  dataInicio: string
  dataFim: string
}

interface ContratosFiltersProps {
  open: boolean
  anchorRef: React.RefObject<HTMLButtonElement | null>
  values: ContratosFiltersValues
  onChange: (values: ContratosFiltersValues) => void
  onClose: () => void
  onClear: () => void
  /** Quando false, oculta o filtro por tipo (ex.: página só de propostas). */
  showTipoFilter?: boolean
}

export function ContratosFilters({
  open,
  anchorRef,
  values,
  onChange,
  onClose,
  onClear,
  showTipoFilter = true,
}: ContratosFiltersProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 })

  const hasActiveFilters = Boolean((showTipoFilter && values.tipo) || values.dataInicio || values.dataFim)

  const tipoOptions = useMemo(
    () => [{ value: '', label: 'Todos os tipos' }, ...TIPOS_CONTRATO.map((t) => ({ value: t.value, label: t.label }))],
    []
  )

  useEffect(() => {
    if (!open || !anchorRef.current) return

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      // `position: fixed` usa coordenadas do viewport (nao somar scroll da janela).
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - 320),
        width: 320,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      const panelNode = panelRef.current
      const anchorNode = anchorRef.current
      const target = event.target as Node
      if (panelNode?.contains(target)) return
      if (anchorNode?.contains(target)) return
      onClose()
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="fixed z-[90] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="space-y-3">
        {showTipoFilter ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tipo de contrato</label>
            <select
              value={values.tipo}
              onChange={(e) => onChange({ ...values, tipo: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {tipoOptions.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Data inicial</label>
            <input
              type="date"
              value={values.dataInicio}
              onChange={(e) => onChange({ ...values, dataInicio: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Data final</label>
            <input
              type="date"
              value={values.dataFim}
              onChange={(e) => onChange({ ...values, dataFim: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {hasActiveFilters ? (
            <Button size="sm" variant="outline" onClick={onClear}>
              Limpar
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
