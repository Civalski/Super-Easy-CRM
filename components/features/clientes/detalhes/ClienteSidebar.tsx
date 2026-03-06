'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/format'
import type { Cliente } from './types'

interface ClienteSidebarProps {
  cliente: Cliente
}

const EMPTY_GASTOS: Array<{ mes: string; valor: number }> = []

function SidebarStat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${className}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="mt-1 block text-[11px]">{label}</span>
    </div>
  )
}

export function ClienteSidebar({ cliente }: ClienteSidebarProps) {
  const resumo = cliente.historicoComercial?.resumo
  const gastosUltimosSeisMeses = cliente.historicoComercial?.gastoMensalUltimosSeisMeses ?? EMPTY_GASTOS
  const clienteNumero = typeof cliente.numero === 'number' ? String(cliente.numero) : ''
  const clienteSearchParam = clienteNumero ? `&search=${encodeURIComponent(clienteNumero)}` : ''
  const baseOportunidades = `/oportunidades?clienteId=${cliente.id}&clienteNome=${encodeURIComponent(cliente.nome)}${clienteSearchParam}`
  const basePedidos = `/pedidos?clienteId=${cliente.id}&clienteNome=${encodeURIComponent(cliente.nome)}${clienteSearchParam}`

  const chartData = gastosUltimosSeisMeses
  const maxValue = Math.max(1, ...chartData.map((item) => Number(item.valor || 0)))
  const chartWidth = 280
  const chartHeight = 94
  const padX = 10
  const padY = 8
  const innerWidth = chartWidth - padX * 2
  const innerHeight = chartHeight - padY * 2

  const points = chartData.map((item, index) => {
    const value = Number(item.valor || 0)
    return {
      ...item,
      x: padX + (chartData.length > 1 ? (index / (chartData.length - 1)) * innerWidth : innerWidth / 2),
      y: padY + innerHeight - (value / maxValue) * innerHeight,
      value,
    }
  })

  const linePath = points.length > 0
    ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    : ''
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padY + innerHeight} L ${points[0].x} ${padY + innerHeight} Z`
    : ''

  return (
    <aside className="space-y-4 xl:sticky xl:top-[88px]">
      <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Resumo comercial</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`${baseOportunidades}&aba=abertas`} className="block">
            <SidebarStat
              label="Orcamentos abertos"
              value={resumo?.orcamentosEmAberto ?? 0}
              className="border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
            />
          </Link>
          <Link href={`${basePedidos}&statusEntrega=pendente,em_preparacao,enviado&aba=andamento`} className="block">
            <SidebarStat
              label="Pedidos em aberto"
              value={resumo?.pedidosEmAberto ?? 0}
              className="border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
            />
          </Link>
          <Link href={`${basePedidos}&statusEntrega=entregue&aba=vendas`} className="block">
            <SidebarStat
              label="Compras concluidas"
              value={resumo?.comprasConcluidas ?? 0}
              className="border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            />
          </Link>
          <Link href={`${baseOportunidades}&aba=canceladas`} className="block">
            <SidebarStat
              label="Cancelamentos"
              value={resumo?.cancelamentos ?? 0}
              className="border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            />
          </Link>
        </div>
      </section>

      <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compras ultimos 6 meses</h3>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            {formatCurrency(resumo?.gastoUltimosSeisMeses ?? 0)}
          </span>
        </div>

        {points.length > 0 ? (
          <>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full"
              style={{ minHeight: '80px' }}
              role="img"
              aria-label="Grafico de linha com compras do cliente nos ultimos 6 meses"
            >
              <defs>
                <linearGradient id="cliente-sidebar-compras-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0, 1, 2].map((step) => {
                const y = padY + (step / 2) * innerHeight
                return (
                  <line
                    key={step}
                    x1={padX}
                    y1={y}
                    x2={padX + innerWidth}
                    y2={y}
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700/70"
                    strokeWidth="1"
                    strokeDasharray={step > 0 ? '4 4' : undefined}
                  />
                )
              })}

              <path d={areaPath} fill="url(#cliente-sidebar-compras-area)" />
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />

              {points.map((point) => (
                <g key={point.mes}>
                  <circle cx={point.x} cy={point.y} r="3" fill="#10b981" opacity="0.22" />
                  <circle cx={point.x} cy={point.y} r="1.9" fill="#10b981" />
                </g>
              ))}
            </svg>

            <div className="mt-1 grid grid-cols-6 gap-1">
              {points.map((point) => (
                <div key={`label-${point.mes}`} className="text-center">
                  <p className="truncate text-[10px] font-medium text-gray-600 dark:text-gray-300">{point.mes}</p>
                  <p className="truncate text-[9px] text-gray-500 dark:text-gray-400">{formatCurrency(point.value)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">Sem compras registradas nos ultimos 6 meses.</p>
        )}
      </section>

    </aside>
  )
}
