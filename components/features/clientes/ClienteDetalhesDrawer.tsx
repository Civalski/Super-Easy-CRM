'use client'

import { useEffect, useState } from 'react'
import { differenceInDays } from 'date-fns'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  Building2,
  Calendar,
  Clock,
  Edit2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  X,
} from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { ViewGridItem, ViewInfoBlock } from './detalhes/InfoFieldBlocks'
import type { Cliente } from './detalhes/types'

interface ClienteDetalhesDrawerProps {
  open: boolean
  clienteId: string | null
  clienteNome?: string
  onClose: () => void
  /** Ao clicar em "Editar cliente", chama com o cliente carregado (permite editar sem navegar) */
  onEditCliente?: (cliente: Cliente) => void
}

const EMPTY_GASTOS: Array<{ mes: string; valor: number }> = []

function formatDiasSemComprar(dias: number): string {
  if (dias <= 0) return 'Comprou recentemente'
  if (dias === 1) return '1 dia sem comprar'
  if (dias < 30) return `${dias} dias sem comprar`
  if (dias < 60) return `${Math.floor(dias / 30)} mês sem comprar`
  return `${Math.floor(dias / 30)} meses sem comprar`
}

export function ClienteDetalhesDrawer({
  open,
  clienteId,
  clienteNome,
  onClose,
  onEditCliente,
}: ClienteDetalhesDrawerProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !clienteId) {
      setCliente(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/clientes/${clienteId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao carregar cliente')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setCliente(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar cliente')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, clienteId])

  const hc = cliente?.historicoComercial
  const gastosUltimosSeisMeses = hc?.gastoMensalUltimosSeisMeses ?? EMPTY_GASTOS
  const resumo = hc?.resumo

  const pedidosEntregues = (hc?.pedidosRecentes ?? []).filter(
    (p) => p.statusEntrega === 'entregue' && p.pagamentoConfirmado
  )
  const ultimaCompra = pedidosEntregues.length > 0
    ? pedidosEntregues.reduce((maisRecente, p) => {
        const dataP = new Date(p.updatedAt)
        const dataR = new Date(maisRecente.updatedAt)
        return dataP > dataR ? p : maisRecente
      })
    : null
  const diasSemComprar = ultimaCompra
    ? differenceInDays(new Date(), new Date(ultimaCompra.updatedAt))
    : null

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalhes do Cliente
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {clienteNome ?? 'Informações e histórico comercial'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
              {error}
            </div>
          ) : cliente ? (
            <div className="space-y-5">
              <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
                <h2 className="mb-3 truncate text-base font-semibold text-gray-900 dark:text-white">{cliente.nome}</h2>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Criado em {formatDate(cliente.createdAt)} | Atualizado em {formatDate(cliente.updatedAt)}
                </p>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <ViewGridItem
                    label="Código"
                    value={cliente.numero != null ? String(cliente.numero).padStart(5, '0') : null}
                  />
                  <ViewInfoBlock icon={Mail} label="Email" value={cliente.email} />
                  <ViewInfoBlock icon={Phone} label="Telefone" value={cliente.telefone} />
                  <ViewInfoBlock icon={Building2} label="Empresa" value={cliente.empresa} />
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    <MapPin size={14} />
                    Endereço
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ViewGridItem label="Endereço" value={cliente.endereco} />
                    <ViewGridItem label="Cidade" value={cliente.cidade} />
                    <ViewGridItem label="Estado" value={cliente.estado ? cliente.estado.toUpperCase() : null} />
                    <ViewGridItem label="CEP" value={cliente.cep} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    <FileText size={14} />
                    Mais informações
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ViewGridItem label="Cargo" value={cliente.cargo} />
                    <ViewGridItem label="Documento" value={cliente.documento} />
                    <ViewGridItem label="Website" value={cliente.website} />
                    <ViewGridItem
                      label="Data nascimento"
                      value={cliente.dataNascimento ? formatDate(cliente.dataNascimento) : null}
                    />
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-gray-200/80 bg-gray-50/40 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Observações</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{cliente.observacoes || '-'}</p>
                </div>
                {cliente.camposPersonalizados && cliente.camposPersonalizados.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-gray-200/80 bg-gray-50/40 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Campos personalizados
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cliente.camposPersonalizados.map((cp, index) => (
                        <ViewGridItem key={index} label={cp.label} value={cp.value} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Resumo comercial
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-800 dark:bg-amber-900/20">
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {resumo?.orcamentosEmAberto ?? 0}
                    </span>
                    <span className="mt-1 block text-[11px] text-amber-700 dark:text-amber-400">
                      Orçamentos abertos
                    </span>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 dark:border-blue-800 dark:bg-blue-900/20">
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {resumo?.pedidosEmAberto ?? 0}
                    </span>
                    <span className="mt-1 block text-[11px] text-blue-700 dark:text-blue-400">
                      Pedidos em aberto
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {resumo?.comprasConcluidas ?? 0}
                    </span>
                    <span className="mt-1 block text-[11px] text-emerald-700 dark:text-emerald-400">
                      Compras concluídas
                    </span>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 dark:border-red-800 dark:bg-red-900/20">
                    <span className="text-lg font-bold text-red-700 dark:text-red-400">
                      {resumo?.cancelamentos ?? 0}
                    </span>
                    <span className="mt-1 block text-[11px] text-red-700 dark:text-red-400">
                      Cancelamentos
                    </span>
                  </div>
                </div>
              </section>

              <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Valor gasto nos últimos 6 meses
                  </h3>
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    {formatCurrency(resumo?.gastoUltimosSeisMeses ?? 0)}
                  </span>
                </div>
                {gastosUltimosSeisMeses.length > 0 ? (
                  (() => {
                    const chartData = gastosUltimosSeisMeses
                    const maxValue = Math.max(1, ...chartData.map((item) => Number(item.valor || 0)))
                    const chartWidth = 400
                    const chartHeight = 120
                    const padX = 12
                    const padY = 10
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
                    const gradientId = `cliente-drawer-compras-${cliente.id}`
                    return (
                      <>
                        <svg
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          className="w-full"
                          style={{ minHeight: '100px' }}
                          role="img"
                          aria-label="Gráfico de linha com compras do cliente nos últimos 6 meses"
                        >
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
                          <path d={areaPath} fill={`url(#${gradientId})`} />
                          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          {points.map((point) => (
                            <g key={point.mes}>
                              <circle cx={point.x} cy={point.y} r="3" fill="#10b981" opacity="0.22" />
                              <circle cx={point.x} cy={point.y} r="1.9" fill="#10b981" />
                            </g>
                          ))}
                        </svg>
                        <div className="mt-2 grid grid-cols-6 gap-1">
                          {points.map((point) => (
                            <div key={`label-${point.mes}`} className="text-center">
                              <p className="truncate text-[10px] font-medium text-gray-600 dark:text-gray-300">{point.mes}</p>
                              <p className="truncate text-[9px] text-gray-500 dark:text-gray-400">{formatCurrency(point.value)}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sem compras registradas nos últimos 6 meses.
                  </p>
                )}
              </section>

              <section className="crm-card border border-gray-200/70 p-4 dark:border-gray-700">
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Última compra
                </h3>
                {ultimaCompra ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Calendar size={16} className="shrink-0 text-gray-500" />
                      <span>{formatDate(ultimaCompra.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(ultimaCompra.totalLiquido)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={16} className="shrink-0" />
                      <span>{formatDiasSemComprar(diasSemComprar ?? 0)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma compra concluída registrada.
                  </p>
                )}
              </section>

              <div className="flex justify-end gap-2 pt-2">
                {onEditCliente ? (
                  <button
                    type="button"
                    onClick={() => {
                      onEditCliente(cliente)
                      onClose()
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  >
                    <Edit2 size={16} />
                    Editar cliente
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SideCreateDrawer>
  )
}
