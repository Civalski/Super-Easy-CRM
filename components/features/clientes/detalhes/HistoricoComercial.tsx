'use client'

import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Cliente } from './types'
import { formatOportunidadeStatus, formatEntregaStatus, getBadgeClass } from './utils'

interface HistoricoComercialProps {
  cliente: Cliente
}

export function HistoricoComercial({ cliente }: HistoricoComercialProps) {
  const hc = cliente.historicoComercial
  if (!hc) return null

  const orcamentosLink = `/oportunidades?clienteId=${cliente.id}&clienteNome=${encodeURIComponent(cliente.nome)}`
  const pedidosLink = `/pedidos?clienteId=${cliente.id}&clienteNome=${encodeURIComponent(cliente.nome)}`

  const getOportunidadeBadge = (status: string) => {
    if (status === 'fechada') return getBadgeClass('success')
    if (status === 'perdida') return getBadgeClass('danger')
    return getBadgeClass('warning')
  }

  const getPedidoBadge = (pedido: { oportunidade: { status: string }; statusEntrega: string; pagamentoConfirmado: boolean }) => {
    if (pedido.oportunidade.status === 'perdida') return getBadgeClass('danger')
    if (pedido.statusEntrega === 'entregue' && pedido.pagamentoConfirmado) return getBadgeClass('success')
    return getBadgeClass('info')
  }

  const getPedidoStatusLabel = (pedido: { oportunidade: { status: string }; statusEntrega: string; pagamentoConfirmado: boolean }) => {
    if (pedido.oportunidade.status === 'perdida') return 'Cancelado'
    if (pedido.statusEntrega === 'entregue' && pedido.pagamentoConfirmado) return 'Concluido'
    return formatEntregaStatus(pedido.statusEntrega)
  }

  return (
    <div id="historico-comercial" className="crm-card p-3.5 md:p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Historico comercial</h4>
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(hc.resumo.gastoUltimosSeisMeses)}
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border border-gray-200/70 p-2.5 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Orcamentos recentes</h4>
            <Link href={orcamentosLink} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              Ver todos
            </Link>
          </div>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {hc.oportunidadesRecentes.length === 0 ? (
              <li className="text-xs text-gray-500 dark:text-gray-400">Nenhum orcamento encontrado.</li>
            ) : (
              hc.oportunidadesRecentes.map((o) => (
                <li key={o.id} className="rounded-lg bg-gray-50 px-2 py-1.5 text-sm dark:bg-gray-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/oportunidades/${o.id}/editar`}
                      className="max-w-full truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {o.titulo}
                    </Link>
                    <span className={`rounded px-2 py-0.5 text-xs ${getOportunidadeBadge(o.status)}`}>
                      {formatOportunidadeStatus(o.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatCurrency(o.valor)}</span>
                    <span>{formatDate(o.createdAt)}</span>
                  </div>
                  {o.status === 'perdida' && o.motivoPerda ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">Motivo: {o.motivoPerda}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200/70 p-2.5 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pedidos recentes</h4>
            <Link href={pedidosLink} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              Ver todos
            </Link>
          </div>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {hc.pedidosRecentes.length === 0 ? (
              <li className="text-xs text-gray-500 dark:text-gray-400">Nenhum pedido encontrado.</li>
            ) : (
              hc.pedidosRecentes.map((p) => (
                <li key={p.id} className="rounded-lg bg-gray-50 px-2 py-1.5 text-sm dark:bg-gray-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">#{p.numero}</span>
                    <Link href={pedidosLink} className="max-w-full truncate font-medium text-blue-600 hover:underline dark:text-blue-400">
                      {p.oportunidade.titulo}
                    </Link>
                    <span className={`rounded px-2 py-0.5 text-xs ${getPedidoBadge(p)}`}>
                      {getPedidoStatusLabel(p)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>{formatCurrency(p.totalLiquido)}</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
