'use client'

import { LineChart } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatMonthLabel } from '@/lib/format'

interface FluxoSerie {
  month: string
  recebido: number
  saida: number
  previstoReceber: number
  previstoPagar: number
  saldoProjetado: number
}

interface FluxoData {
  totals: {
    recebido: number
    saida: number
    previstoReceber: number
    previstoPagar: number
    saldoProjetado: number
  }
  series: FluxoSerie[]
}

interface FluxoCaixaResumoProps {
  fluxo: FluxoData | null
}

export function FluxoCaixaResumo({ fluxo }: FluxoCaixaResumoProps) {
  const router = useRouter()

  const goToFinanceiro = () => {
    router.push('/financeiro')
  }

  return (
    <div
      className="crm-card cursor-pointer p-5 transition hover:ring-1 hover:ring-purple-200/60 dark:hover:ring-purple-700/35"
      onClick={goToFinanceiro}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          goToFinanceiro()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Abrir financeiro"
    >
      <div className="mb-3 flex items-center gap-2">
        <LineChart className="h-5 w-5 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Fluxo de Caixa (6 meses)</h2>
      </div>

      {fluxo ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Recebido</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(fluxo.totals.recebido)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Pago</p>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrency(fluxo.totals.saida)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Prev. receber</p>
              <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                {formatCurrency(fluxo.totals.previstoReceber)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Prev. pagar</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(fluxo.totals.previstoPagar)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Saldo proj.</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(fluxo.totals.saldoProjetado)}
              </p>
            </div>
          </div>

          <div className="space-y-2 lg:hidden">
            {fluxo.series.map((item) => (
              <div
                key={item.month}
                className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatMonthLabel(item.month)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Recebido</span>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(item.recebido)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Pago</span>
                    <p className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(item.saida)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Prev. rec.</span>
                    <p className="font-medium text-cyan-600 dark:text-cyan-400">{formatCurrency(item.previstoReceber)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Prev. pag.</span>
                    <p className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(item.previstoPagar)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Saldo</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.saldoProjetado)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-2 py-1.5">Mes</th>
                  <th className="px-2 py-1.5">Recebido</th>
                  <th className="px-2 py-1.5">Pago</th>
                  <th className="px-2 py-1.5">Prev. rec.</th>
                  <th className="px-2 py-1.5">Prev. pag.</th>
                  <th className="px-2 py-1.5">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {fluxo.series.map((item) => (
                  <tr key={item.month} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-1.5 text-gray-800 dark:text-gray-100">{formatMonthLabel(item.month)}</td>
                    <td className="px-2 py-1.5 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.recebido)}
                    </td>
                    <td className="px-2 py-1.5 text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.saida)}
                    </td>
                    <td className="px-2 py-1.5 text-cyan-600 dark:text-cyan-400">
                      {formatCurrency(item.previstoReceber)}
                    </td>
                    <td className="px-2 py-1.5 text-orange-600 dark:text-orange-400">
                      {formatCurrency(item.previstoPagar)}
                    </td>
                    <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.saldoProjetado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados de fluxo.</p>
      )}
    </div>
  )
}
