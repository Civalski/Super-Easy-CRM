'use client'

import { BarChart3, FileText } from 'lucide-react'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import { DashboardChart } from '@/components/features/relatorios/DashboardChart'
import { CreateRelatorioDrawer } from '@/components/features/relatorios/CreateRelatorioDrawer'
import { useRelatoriosPage } from '@/components/features/relatorios/hooks/useRelatoriosPage'

export default function RelatoriosPage() {
  const minimal = usePageHeaderMinimal()
  const {
    dashboardRef,
    drawerOpen,
    setDrawerOpen,
    dashboardTitle,
    setDashboardTitle,
    dashboardDescription,
    setDashboardDescription,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    blocks,
    applyTemplate,
    addBlock,
    removeBlock,
    updateBlockField,
    updateBlockChartType,
    toggleBlockMetric,
    setMetricColor,
    handleFetchAndGenerate,
    loading,
    error,
    pdfBlocks,
    periodLabel,
  } = useRelatoriosPage()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-purple-500/25">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatorios e Analises</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gere arquivos PDF com visao comercial mais completa
              </p>
            </div>
          </div>
        )}

        <div className={`flex flex-wrap items-end gap-3 ${minimal ? 'md:ml-auto' : ''}`}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700"
          >
            <FileText size={16} />
            Novo Relatorio PDF
          </button>
        </div>
      </div>

      <div className="relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0,transparent_100%)]" />
        <div className="relative z-10 mb-6 rounded-full border border-gray-100 bg-white p-4 shadow-xs dark:border-gray-700 dark:bg-slate-800">
          <BarChart3 className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="relative z-10 text-xl font-medium text-slate-700 dark:text-slate-300">
          Nenhum relatorio na tela
        </h2>
        <p className="relative z-10 mt-2 max-w-sm text-sm text-slate-500">
          Use <strong>Novo Relatorio PDF</strong> para criar relatorios com modelos prontos, filtros por periodo
          e cruzamento de metricas.
        </p>
      </div>

      <CreateRelatorioDrawer
        open={drawerOpen}
        loading={loading}
        error={error}
        dashboardTitle={dashboardTitle}
        dashboardDescription={dashboardDescription}
        startDate={startDate}
        endDate={endDate}
        blocks={blocks}
        onClose={() => setDrawerOpen(false)}
        onDashboardTitleChange={setDashboardTitle}
        onDashboardDescriptionChange={setDashboardDescription}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onTemplateApply={applyTemplate}
        onAddBlock={addBlock}
        onRemoveBlock={removeBlock}
        onUpdateBlockTitle={(blockId, value) => updateBlockField(blockId, 'title', value)}
        onUpdateBlockDescription={(blockId, value) => updateBlockField(blockId, 'description', value)}
        onUpdateBlockChartType={updateBlockChartType}
        onToggleBlockMetric={toggleBlockMetric}
        onSetMetricColor={setMetricColor}
        onGenerate={handleFetchAndGenerate}
      />

      <DashboardChart
        ref={dashboardRef}
        dashboardTitle={dashboardTitle}
        dashboardDescription={dashboardDescription}
        blocks={pdfBlocks}
        periodLabel={periodLabel}
      />
    </div>
  )
}
