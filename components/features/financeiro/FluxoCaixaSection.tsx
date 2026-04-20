'use client'

import { LineChart } from '@/lib/icons'
import { formatCurrency, formatMonthLabel } from '@/lib/format'
import type { FluxoData } from './types'

interface FluxoCaixaSectionProps {
  fluxo: FluxoData | null
  ambienteLabel: string
  onMonthClick?: (month: string) => void
}

const summaryCards = [
  { label: 'Recebido', key: 'recebido' as const, color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Pago', key: 'saida' as const, color: 'text-rose-600 dark:text-rose-400' },
  { label: 'Previsto receber', key: 'previstoReceber' as const, color: 'text-cyan-600 dark:text-cyan-400' },
  { label: 'Previsto pagar', key: 'previstoPagar' as const, color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Saldo projetado', key: 'saldoProjetado' as const, color: 'text-gray-900 dark:text-gray-100' },
] as const

const numericColumns = [
  { label: 'Recebido', key: 'recebido' as const, color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Pago', key: 'saida' as const, color: 'text-rose-600 dark:text-rose-400' },
  { label: 'Prev. receber', key: 'previstoReceber' as const, color: 'text-cyan-600 dark:text-cyan-400' },
  { label: 'Prev. pagar', key: 'previstoPagar' as const, color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Saldo proj.', key: 'saldoProjetado' as const, color: 'text-gray-700 dark:text-gray-300' },
] as const

export default function FluxoCaixaSection({ fluxo, ambienteLabel, onMonthClick }: FluxoCaixaSectionProps) {
  return (
    <div className="crm-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <LineChart className="h-5 w-5 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Fluxo de Caixa (6 meses) - {ambienteLabel}
        </h2>
      </div>

      {!fluxo ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados de fluxo.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className={`font-semibold ${card.color}`}>{formatCurrency(fluxo.totals[card.key])}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 lg:hidden">
            {fluxo.series.map((item) => {
              const body = (
                <>
                  <p className="text-sm font-semibold text-gray-900 underline decoration-dashed decoration-gray-300 underline-offset-4 dark:text-gray-100 dark:decoration-gray-600">
                    {formatMonthLabel(item.month)}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                    {numericColumns.map((col) => (
                      <div key={col.key}>
                        <span className="text-gray-500 dark:text-gray-400">{col.label}</span>
                        <p className={`font-medium ${col.color}`}>{formatCurrency(item[col.key])}</p>
                      </div>
                    ))}
                  </div>
                </>
              )
              const cardClass =
                'w-full rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-left dark:border-gray-700 dark:bg-gray-800/50'
              if (onMonthClick) {
                return (
                  <button
                    key={item.month}
                    type="button"
                    onClick={() => onMonthClick(item.month)}
                    className={`${cardClass} cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    {body}
                  </button>
                )
              }
              return (
                <div key={item.month} className={cardClass}>
                  {body}
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-2 py-2">Mes</th>
                  {numericColumns.map((col) => (
                    <th key={col.key} className="px-2 py-2">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fluxo.series.map((item) => (
                  <tr 
                    key={item.month} 
                    onClick={() => onMonthClick?.(item.month)}
                    className="border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-2 py-2 text-gray-800 dark:text-gray-100 font-medium underline decoration-dashed decoration-gray-300 dark:decoration-gray-600 underline-offset-4">{formatMonthLabel(item.month)}</td>
                    {numericColumns.map((col) => (
                      <td key={col.key} className={`px-2 py-2 ${col.color}`}>
                        {formatCurrency(item[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
