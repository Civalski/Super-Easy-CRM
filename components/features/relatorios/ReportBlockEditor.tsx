'use client'

import { BarChart3, BarChartBig, PieChart, Trash2 } from 'lucide-react'
import { METRICAS_OPCIONAIS } from './constants'
import type { ChartType, MetricaKey, ReportBlockDraft } from './types'

interface ReportBlockEditorProps {
  block: ReportBlockDraft
  index: number
  canRemove: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onChartTypeChange: (value: ChartType) => void
  onToggleMetric: (metric: MetricaKey) => void
  onMetricColorChange: (metric: MetricaKey, color: string) => void
  onRemove: () => void
}

export function ReportBlockEditor({
  block,
  index,
  canRemove,
  onTitleChange,
  onDescriptionChange,
  onChartTypeChange,
  onToggleMetric,
  onMetricColorChange,
  onRemove,
}: ReportBlockEditorProps) {
  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Bloco {index + 1}</p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Titulo do bloco</label>
        <input
          type="text"
          value={block.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Ex: Vendas x Perdas"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo de grafico</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChartTypeChange('linha')}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              block.chartType === 'linha'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100'
                : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200'
            }`}
          >
            <BarChart3 className="mx-auto mb-1 h-4 w-4" />
            Linha
          </button>
          <button
            type="button"
            onClick={() => onChartTypeChange('barra')}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              block.chartType === 'barra'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100'
                : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200'
            }`}
          >
            <BarChartBig className="mx-auto mb-1 h-4 w-4" />
            Barra
          </button>
          <button
            type="button"
            onClick={() => onChartTypeChange('pizza')}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              block.chartType === 'pizza'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100'
                : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200'
            }`}
          >
            <PieChart className="mx-auto mb-1 h-4 w-4" />
            Pizza
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Metricas e cores</label>
        <div className="space-y-1.5 rounded-lg border border-gray-100 bg-slate-50 p-2.5 dark:border-gray-700 dark:bg-slate-900/40">
          {METRICAS_OPCIONAIS.map((metric) => {
            const isSelected = block.selectedMetrics.includes(metric.key)
            const Icon = metric.icon

            return (
              <label
                key={metric.key}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  isSelected
                    ? 'border-indigo-200 bg-white dark:border-indigo-500/40 dark:bg-slate-800'
                    : 'border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleMetric(metric.key)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-xs text-gray-700 dark:text-gray-300">{metric.label}</span>
                {isSelected && (
                  <input
                    type="color"
                    value={block.metricColors[metric.key]}
                    onChange={(event) => onMetricColorChange(metric.key, event.target.value)}
                    className="h-6 w-8 cursor-pointer rounded border border-gray-300 p-0.5 dark:border-gray-600"
                    title={`Cor para ${metric.label}`}
                  />
                )}
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Descricao abaixo do grafico
        </label>
        <textarea
          value={block.description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Escreva uma leitura rapida para este bloco."
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
        />
      </div>
    </section>
  )
}
