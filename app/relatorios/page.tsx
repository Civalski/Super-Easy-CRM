'use client'

import { useState, useRef } from 'react'
import { BarChart3, Loader2, FileText, Download, Target, Users, Receipt, XCircle } from 'lucide-react'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import SideCreateDrawer from '@/components/common/SideCreateDrawer'
import { DashboardChart, type DashboardChartRef } from '@/components/features/relatorios/DashboardChart'

type MetricaKey = 'novos_clientes' | 'orcamentos' | 'pedidos' | 'cancelados'
type ChartType = 'linha' | 'pizza'

interface MetricaOption {
  key: MetricaKey
  label: string
  icon: React.ElementType
}

const METRICAS_OPCIONAIS: MetricaOption[] = [
  { key: 'novos_clientes', label: 'Novos clientes', icon: Users },
  { key: 'orcamentos', label: 'Quantidade de orçamentos', icon: Target },
  { key: 'pedidos', label: 'Quantidade de pedidos', icon: Receipt },
  { key: 'cancelados', label: 'Pedidos/orçamentos cancelados', icon: XCircle },
]

export default function RelatoriosPage() {
  const minimal = usePageHeaderMinimal()
  const dashboardRef = useRef<DashboardChartRef | null>(null)
  
  // Sidebar visibility
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Form State
  const [description, setDescription] = useState('')
  const [chartType, setChartType] = useState<ChartType>('linha')
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-01-01`
  })
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-12-31`
  })
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricaKey>>(new Set<MetricaKey>(['pedidos']))

  // Data state
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const toggleMetric = (key: MetricaKey) => {
    setSelectedMetrics(prev => {
      const nov = new Set(prev)
      if (nov.has(key)) {
        if (nov.size > 1) nov.delete(key) // Evita deixar vazio
      } else {
        nov.add(key)
      }
      return nov
    })
  }

  const handleFetchAndGenerate = async () => {
    if (selectedMetrics.size === 0) {
      setError('Selecione pelo menos uma métrica para o relatório.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams()
      query.set('data_inicio', startDate)
      query.set('data_fim', endDate)
      selectedMetrics.forEach(m => query.append('metricas', m))

      const res = await fetch(`/api/relatorios/dashboard?${query.toString()}`)
      if (!res.ok) throw new Error('Erro ao buscar dados do relatório')
      
      const json = await res.json()
      setData(json)
      
      // Wait for React to render the new data into the DOM offscreen
      setTimeout(() => {
        if (dashboardRef.current) {
          dashboardRef.current.generatePdf().finally(() => {
            setLoading(false)
            setDrawerOpen(false) // Opcional: fechar drawer ao concluir
          })
        } else {
          setLoading(false)
          setError('Erro interno ao preparar o arquivo.')
        }
      }, 500) // 500ms allows Recharts animations to finish before capturing

    } catch (err) {
      console.error(err)
      setError('Erro ao carregar os dados para gerar o dashboard.')
      setLoading(false)
    }
  }

  const periodLabel = `${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`
  const metricsData = METRICAS_OPCIONAIS.filter(m => selectedMetrics.has(m.key)).map(m => ({
    key: m.key,
    label: m.label
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {!minimal && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-purple-500/25">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios e Análises</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gere arquivos em PDF formatados do desempenho do seu negócio
              </p>
            </div>
          </div>
        )}

        <div className={`flex flex-wrap items-end gap-3 ${minimal ? 'md:ml-auto' : ''}`}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
          >
            <FileText size={16} />
            Novo Relatório PDF
          </button>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 p-8 text-center text-slate-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0,transparent_100%)] w-full h-full pointer-events-none" />
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-xs border border-gray-100 dark:border-gray-700 mb-6 relative z-10">
          <BarChart3 className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300 relative z-10">Nenhum relatório na tela</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm relative z-10">
          Você pode cruzar e comparar diferentes dados do seu CRM através da opção de menu lateral clicando em <strong>Novo Relatório PDF</strong>.
        </p>
      </div>

      <SideCreateDrawer
        open={drawerOpen}
        onClose={() => !loading && setDrawerOpen(false)}
        maxWidthClass="max-w-md"
      >
        <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl relative">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 sticky top-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-1">
                Criar Relatório Personalizado
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preencha o formulário para configurar o PDF
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title / Description */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Título descritivo do PDF
              </label>
              <input
                type="text"
                placeholder="Ex: Análise de Vendas Q1 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none dark:border-gray-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Chart Type */}
            <div className="space-y-3">
               <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Formato de Gráfico
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChartType('linha')}
                  className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    chartType === 'linha'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300'
                  }`}
                >
                  <BarChart3 className="h-5 w-5 mx-auto mb-1 opacity-70" />
                  Evolução em Linha
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('pizza')}
                  className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    chartType === 'pizza'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300'
                  }`}
                >
                  <Target className="h-5 w-5 mx-auto mb-1 opacity-70" />
                  Total em Pizza
                </button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 outline-none dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-500 outline-none dark:border-gray-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Relacionar Informações */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Cruzar Informações no Gráfico
              </label>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                {METRICAS_OPCIONAIS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = selectedMetrics.has(opt.key)
                  return (
                    <label 
                      key={opt.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-white border-indigo-200 shadow-xs dark:bg-slate-800 dark:border-indigo-500/50' 
                          : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMetric(opt.key)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 outline-none cursor-pointer"
                      />
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isSelected ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 dark:bg-slate-900 dark:border-gray-800 mt-auto">
            <button
              type="button"
              onClick={handleFetchAndGenerate}
              disabled={loading || selectedMetrics.size === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 focus:outline-[none] disabled:opacity-50 transition-all dark:focus:ring-indigo-900"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando PDF do Relatório...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Gerar e Baixar PDF ({selectedMetrics.size} métricas)
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              O tempo de geração pode variar de acordo com a quantidade de dados.
            </p>
          </div>
        </div>
      </SideCreateDrawer>

      <DashboardChart 
        ref={dashboardRef}
        data={data} 
        chartType={chartType} 
        metrics={metricsData}
        description={description}
        periodLabel={periodLabel} 
      />
    </div>
  )
}
