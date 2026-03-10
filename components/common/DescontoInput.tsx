'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type DescontoTipo = 'valor' | 'percentual'

interface DescontoInputProps {
  bruto: number
  desconto: number
  onChange: (descontoValor: number) => void
  onBlur?: (descontoValor: number) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

/** Converte percentual em valor absoluto. */
function descontoFromPct(bruto: number, pct: number): number {
  if (bruto <= 0 || !Number.isFinite(pct)) return 0
  return Math.min(bruto, Math.max(0, (bruto * pct) / 100))
}

/** Converte valor em percentual. */
function pctFromDesconto(bruto: number, desconto: number): number {
  if (bruto <= 0 || desconto <= 0) return 0
  return Math.min(100, (desconto / bruto) * 100)
}

export function DescontoInput({
  bruto,
  desconto,
  onChange,
  onBlur,
  disabled = false,
  className = '',
  size = 'sm',
}: DescontoInputProps) {
  const [tipo, setTipo] = useState<DescontoTipo>('valor')
  const lastValueRef = useRef<number>(desconto)
  useEffect(() => {
    lastValueRef.current = desconto
  }, [desconto])

  const percentual = pctFromDesconto(bruto, desconto)

  const handleChange = useCallback(
    (v: number) => {
      lastValueRef.current = v
      onChange(v)
    },
    [onChange]
  )

  const handleValorChange = useCallback(
    (raw: string) => {
      const num = parseFloat(raw.replace(',', '.')) || 0
      const v = Math.max(0, Math.min(bruto, num))
      handleChange(v)
    },
    [bruto, handleChange]
  )

  const handlePercentualChange = useCallback(
    (raw: string) => {
      const pct = parseFloat(raw.replace(',', '.')) || 0
      handleChange(descontoFromPct(bruto, pct))
    },
    [bruto, handleChange]
  )

  const handleBlur = useCallback(() => {
    onBlur?.(lastValueRef.current)
  }, [onBlur])

  const inputClass =
    size === 'sm'
      ? 'w-full min-w-0 rounded-l-md border border-r-0 border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
      : 'w-full min-w-0 rounded-l-lg border border-r-0 border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

  return (
    <div className={`flex items-stretch ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={tipo === 'valor' ? (desconto > 0 ? String(desconto).replace('.', ',') : '') : (percentual > 0 ? String(percentual).replace('.', ',') : '')}
        onChange={(e) => (tipo === 'valor' ? handleValorChange(e.target.value) : handlePercentualChange(e.target.value))}
        onBlur={handleBlur}
        placeholder={tipo === 'valor' ? '0' : '0'}
        className={`${inputClass} min-w-[3.5rem]`}
      />
      <div className="flex shrink-0 rounded-r-md border border-gray-300 dark:border-gray-600">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setTipo('valor')}
          className={`px-1.5 py-1 text-[10px] font-medium transition-colors ${
            tipo === 'valor'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
          }`}
          title="Desconto em valor (R$)"
        >
          R$
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setTipo('percentual')}
          className={`px-1.5 py-1 text-[10px] font-medium transition-colors ${
            tipo === 'percentual'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
          }`}
          title="Desconto em percentual (%)"
        >
          %
        </button>
      </div>
    </div>
  )
}
