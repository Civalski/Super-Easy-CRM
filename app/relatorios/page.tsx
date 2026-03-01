'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import type { FunnelReport, LossesReport, PerformanceReport } from '@/types/reports'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnel, setFunnel] = useState<FunnelReport | null>(null)
  const [losses, setLosses] = useState<LossesReport | null>(null)
  const [performance, setPerformance] = useState<PerformanceReport | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    ).padStart(2, '0')}`
  })

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = `start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`

      const [funnelRes, lossesRes, performanceRes] = await Promise.all([
        fetch(`/api/relatorios/funil?${params}`),
        fetch(`/api/relatorios/perdas?${params}`),
        fetch(`/api/relatorios/performance?${params}`),
      ])

      if (!funnelRes.ok || !lossesRes.ok || !performanceRes.ok) {
        throw new Error('Falha ao carregar relatorios')
      }

      const [funnelData, lossesData, performanceData] = await Promise.all([
        funnelRes.json(),
        lossesRes.json(),
        performanceRes.json(),
      ])

      setFunnel(funnelData)
      setLosses(lossesData)
      setPerformance(performanceData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatorios')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const topRisk = useMemo(() => performance?.riskRanking.slice(0, 8) || [], [performance])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-rose-500 to-red-500 p-2.5 shadow-lg shadow-rose-500/25">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatorios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Funil, perdas e performance comercial
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchReports}
            className="rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && funnel && losses && performance && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="crm-card p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lead para Orçamento</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {funnel.conversion.leadToOrcamento}%
              </p>
            </div>
            <div className="crm-card p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {funnel.conversion.winRate}%
              </p>
            </div>
            <div className="crm-card p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ciclo Medio</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {performance.metrics.cicloMedioDias} dias
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="crm-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Funil</h2>
              </div>
              <div className="space-y-3">
                {funnel.stages.map((stage) => (
                  <div key={stage.key}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>{stage.label}</span>
                      <span>{stage.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (stage.total /
                              Math.max(...funnel.stages.map((item) => item.total), 1)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="crm-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Motivos de Perda
                </h2>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Perdidas</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{losses.totals.perdidas}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor Perdido</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(losses.totals.valorPerdido)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {losses.motivos.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem perdas no periodo.</p>
                )}
                {losses.motivos.slice(0, 5).map((motivo) => (
                  <div
                    key={motivo.motivo}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-200">{motivo.motivo}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {motivo.total} ({motivo.percentual}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="crm-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Orçamentos em Risco
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Atualizado em {formatDate(performance.generatedAt)}
              </span>
            </div>
            {topRisk.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sem orçamentos em risco.</p>
            )}
            {topRisk.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="px-2 py-2">Orçamento</th>
                      <th className="px-2 py-2">Cliente</th>
                      <th className="px-2 py-2">Score</th>
                      <th className="px-2 py-2">Sem atualizar</th>
                      <th className="px-2 py-2">Proxima acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRisk.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-2 py-2 text-gray-800 dark:text-gray-100">{item.titulo}</td>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{item.cliente}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              item.riskLevel === 'alto'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : item.riskLevel === 'medio'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            }`}
                          >
                            {item.riskScore}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                          {item.daysWithoutUpdate} dias
                        </td>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                          {item.nextAction ? formatDate(item.nextAction.at) : 'Nao definida'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}


