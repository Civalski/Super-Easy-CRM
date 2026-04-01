'use client'

import { Download, FilePlus2, Loader2 } from 'lucide-react'
import SideCreateDrawer from '@/components/common/SideCreateDrawer'
import { DATE_PRESETS, REPORT_TEMPLATES } from './constants'
import { ReportBlockEditor } from './ReportBlockEditor'
import type { DatePresetKey, MetricaKey, ReportBlockDraft, ReportTemplateKey } from './types'
import { getDateRangeFromPreset } from './utils'

interface CreateRelatorioDrawerProps {
  open: boolean
  loading: boolean
  error: string
  dashboardTitle: string
  dashboardDescription: string
  startDate: string
  endDate: string
  blocks: ReportBlockDraft[]
  onClose: () => void
  onDashboardTitleChange: (value: string) => void
  onDashboardDescriptionChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onTemplateApply: (value: ReportTemplateKey) => void
  onAddBlock: () => void
  onRemoveBlock: (blockId: string) => void
  onUpdateBlockTitle: (blockId: string, value: string) => void
  onUpdateBlockDescription: (blockId: string, value: string) => void
  onUpdateBlockChartType: (blockId: string, value: 'linha' | 'barra' | 'pizza') => void
  onToggleBlockMetric: (blockId: string, metric: MetricaKey) => void
  onSetMetricColor: (blockId: string, metric: MetricaKey, color: string) => void
  onGenerate: () => void
}

export function CreateRelatorioDrawer({
  open,
  loading,
  error,
  dashboardTitle,
  dashboardDescription,
  startDate,
  endDate,
  blocks,
  onClose,
  onDashboardTitleChange,
  onDashboardDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onTemplateApply,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlockTitle,
  onUpdateBlockDescription,
  onUpdateBlockChartType,
  onToggleBlockMetric,
  onSetMetricColor,
  onGenerate,
}: CreateRelatorioDrawerProps) {
  const applyDatePreset = (preset: DatePresetKey) => {
    const range = getDateRangeFromPreset(preset)
    onStartDateChange(range.startDate)
    onEndDateChange(range.endDate)
  }

  return (
    <SideCreateDrawer open={open} onClose={() => !loading && onClose()} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Construtor de Dashboard PDF</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monte blocos com titulo, grafico, descricao e cores personalizadas.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <section className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aplicar modelo rapido</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TEMPLATES.filter((item) => item.key !== 'personalizado').map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => onTemplateApply(template.key)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  <p>{template.label}</p>
                  <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">{template.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cabecalho do dashboard</label>
            <input
              type="text"
              value={dashboardTitle}
              onChange={(event) => onDashboardTitleChange(event.target.value)}
              placeholder="Ex: Dashboard Comercial - Abril"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
            />
            <textarea
              value={dashboardDescription}
              onChange={(event) => onDashboardDescriptionChange(event.target.value)}
              placeholder="Resumo geral do dashboard."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
            />
          </section>

          <section className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Periodo</label>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyDatePreset(preset.key)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Blocos do dashboard</h4>
              <button
                type="button"
                onClick={onAddBlock}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                Adicionar bloco
              </button>
            </div>

            {blocks.map((block, index) => (
              <ReportBlockEditor
                key={block.id}
                block={block}
                index={index}
                canRemove={blocks.length > 1}
                onTitleChange={(value) => onUpdateBlockTitle(block.id, value)}
                onDescriptionChange={(value) => onUpdateBlockDescription(block.id, value)}
                onChartTypeChange={(value) => onUpdateBlockChartType(block.id, value)}
                onToggleMetric={(metric) => onToggleBlockMetric(block.id, metric)}
                onMetricColorChange={(metric, color) => onSetMetricColor(block.id, metric, color)}
                onRemove={() => onRemoveBlock(block.id)}
              />
            ))}
          </section>
        </div>

        <div className="mt-auto border-t border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando dashboard em PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Gerar e baixar dashboard
              </>
            )}
          </button>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
