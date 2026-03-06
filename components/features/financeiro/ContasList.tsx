'use client'

import { ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp, Loader2, Pencil } from '@/lib/icons'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ContaFinanceira, GrupoContas, PaginationMeta } from './types'
import { getStatusClass } from './utils'

interface ContasListProps {
  gruposContas: GrupoContas[]
  meta: PaginationMeta
  page: number
  onPageChange: (page: number) => void
  activeTipo: 'receber' | 'pagar'
  expandedGrupos: Record<string, boolean>
  onToggleExpand: (id: string) => void
  onRegistrarMovimento: (conta: ContaFinanceira) => void
  onEditConta: (conta: ContaFinanceira) => void
  loading: boolean
}

const ACTION_CLS_RECEBER = 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
const ACTION_CLS_PAGAR = 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'

function GrupoActions({ grupo, isPagar, onRegistrarMovimento, onEditConta, onToggleExpand, isExpanded }: {
  grupo: GrupoContas; isPagar: boolean; isExpanded: boolean
  onRegistrarMovimento: (c: ContaFinanceira) => void; onEditConta: (c: ContaFinanceira) => void; onToggleExpand: (id: string) => void
}) {
  const contaParaEditar = grupo.proximaContaAberta || grupo.contas[0]
  const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
  const actionColor = isPagar ? ACTION_CLS_PAGAR : ACTION_CLS_RECEBER
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {grupo.proximaContaAberta && (
        <button type="button" onClick={() => onRegistrarMovimento(grupo.proximaContaAberta!)}
          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${actionColor}`}>
          {isPagar ? <ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> : <ArrowDownCircle className="mr-1 h-3.5 w-3.5" />}
          {isPagar ? 'Pagar prox.' : 'Receber prox.'}
        </button>
      )}
      {contaParaEditar && (
        <button type="button" onClick={() => onEditConta(contaParaEditar)}
          className="inline-flex items-center rounded-lg border border-indigo-300 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20">
          <Pencil className="mr-1 h-3.5 w-3.5" />Editar
        </button>
      )}
      {isExpansivel && (
        <button type="button" onClick={() => onToggleExpand(grupo.id)}
          className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
          {isExpanded ? 'Ocultar' : grupo.isRecorrenteMensal ? `Lancamentos (${grupo.contas.length})` : `Parcelas ${grupo.totalParcelas}x`}
          {isExpanded ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}

function ParcelasDetail({ grupo, isPagar, onRegistrarMovimento }: {
  grupo: GrupoContas; isPagar: boolean; onRegistrarMovimento: (c: ContaFinanceira) => void
}) {
  const actionColor = isPagar ? ACTION_CLS_PAGAR : ACTION_CLS_RECEBER
  const label = grupo.isRecorrenteMensal ? 'Lancamento' : 'Parcela'

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 text-left text-[10px] uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <th className="px-2 py-1.5 font-semibold">{label}</th>
            <th className="px-2 py-1.5 font-semibold">Vencimento</th>
            <th className="px-2 py-1.5 font-semibold">Valor</th>
            <th className="px-2 py-1.5 font-semibold">Liquidado</th>
            <th className="px-2 py-1.5 font-semibold">Status</th>
            <th className="px-2 py-1.5 text-right font-semibold">Acao</th>
          </tr>
        </thead>
        <tbody>
          {grupo.contas.map((conta) => {
            const contaAberta = conta.status !== 'pago' && conta.status !== 'cancelado'
            return (
              <tr key={conta.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                  {conta.numeroParcela || '-'}{!grupo.isRecorrenteMensal && grupo.totalParcelas ? `/${grupo.totalParcelas}` : ''}
                </td>
                <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{formatDate(conta.dataVencimento)}</td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">{formatCurrency(conta.valorTotal)}</td>
                <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{formatCurrency(conta.valorRecebido)}</td>
                <td className="px-2 py-1.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(conta.status)}`}>{conta.status}</span>
                </td>
                <td className="px-2 py-1.5 text-right">
                  {contaAberta ? (
                    <button type="button" onClick={() => onRegistrarMovimento(conta)}
                      className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${actionColor}`}>
                      {isPagar ? 'Pagar' : 'Receber'}
                    </button>
                  ) : <span className="text-[11px] text-gray-400">-</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const getVencimento = (g: GrupoContas) =>
  g.primeiraData && g.ultimaData && g.primeiraData !== g.ultimaData
    ? `${formatDate(g.primeiraData)} a ${formatDate(g.ultimaData)}` : formatDate(g.primeiraData)

const getSubtitle = (g: GrupoContas) =>
  (g.isRecorrenteMensal ? 'Mensal automatica (sem data final)' : g.isParcelado ? `Parcelado em ${g.totalParcelas}x` : 'Conta unica')
  + (g.autoDebitoAtivo ? ' - debito automatico' : '')

const getParcelasLabel = (g: GrupoContas) =>
  g.isRecorrenteMensal ? `${g.parcelasPagas}/${g.contas.length}` : g.isParcelado ? `${g.parcelasPagas}/${g.totalParcelas}` : 'Unica'

export default function ContasList({
  gruposContas, meta, page, onPageChange, activeTipo, expandedGrupos,
  onToggleExpand, onRegistrarMovimento, onEditConta, loading,
}: ContasListProps) {
  if (loading) return <div className="flex min-h-[120px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
  if (gruposContas.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conta registrada.</p>
  const isPagar = activeTipo === 'pagar'
  return (
    <div className="space-y-2">
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] table-fixed text-sm">
            <thead className="crm-table-head">
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2 font-semibold">Conta</th>
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Parcelas</th>
                <th className="px-3 py-2 font-semibold">Vencimento</th>
                <th className="px-3 py-2 font-semibold">Progresso</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            {gruposContas.map((grupo) => {
              const isExpanded = Boolean(expandedGrupos[grupo.id])
              const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
              return (
                <tbody key={grupo.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <tr className="align-top">
                    <td className="px-3 py-2.5">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{grupo.titulo}</p>
                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{getSubtitle(grupo)}</p>
                    </td>
                    <td className="truncate px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">{grupo.cliente}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200">{getParcelasLabel(grupo)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">{getVencimento(grupo)}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{formatCurrency(grupo.valorRecebido)}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">de {formatCurrency(grupo.valorTotal)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(grupo.statusResumo)}`}>{grupo.statusResumo}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end">
                        <GrupoActions grupo={grupo} isPagar={isPagar} isExpanded={isExpanded}
                          onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta} onToggleExpand={onToggleExpand} />
                      </div>
                    </td>
                  </tr>
                  {isExpansivel && isExpanded && (
                    <tr className="bg-gray-50/80 dark:bg-slate-900/45">
                      <td colSpan={7} className="px-3 py-2.5">
                        <ParcelasDetail grupo={grupo} isPagar={isPagar} onRegistrarMovimento={onRegistrarMovimento} />
                      </td>
                    </tr>
                  )}
                </tbody>
              )
            })}
          </table>
        </div>
      </div>

      <div className="space-y-2 lg:hidden">
        {gruposContas.map((grupo) => {
          const isExpanded = Boolean(expandedGrupos[grupo.id])
          const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
          return (
            <div key={grupo.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{grupo.titulo}</p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {grupo.cliente} - {grupo.isRecorrenteMensal ? 'Mensal automatica' : grupo.isParcelado ? `${grupo.totalParcelas}x` : 'Conta unica'}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(grupo.statusResumo)}`}>{grupo.statusResumo}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                <p>Venc.: {getVencimento(grupo)}</p>
                <p>Parc.: {getParcelasLabel(grupo)}</p>
                <p className="col-span-2">Liquidado {formatCurrency(grupo.valorRecebido)} de {formatCurrency(grupo.valorTotal)}</p>
              </div>
              <div className="mt-2">
                <GrupoActions grupo={grupo} isPagar={isPagar} isExpanded={isExpanded}
                  onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta} onToggleExpand={onToggleExpand} />
              </div>
              {isExpansivel && isExpanded && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-slate-900/50">
                  {grupo.contas.map((conta) => {
                    const contaAberta = conta.status !== 'pago' && conta.status !== 'cancelado'
                    return (
                      <div key={conta.id} className="flex items-center justify-between gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                        <div>
                          <p>{grupo.isRecorrenteMensal ? 'Lancamento' : 'Parcela'} {conta.numeroParcela || '-'}{!grupo.isRecorrenteMensal && grupo.totalParcelas ? `/${grupo.totalParcelas}` : ''} - {formatDate(conta.dataVencimento)}</p>
                          <p className="text-gray-500 dark:text-gray-400">{formatCurrency(conta.valorRecebido)} de {formatCurrency(conta.valorTotal)}</p>
                        </div>
                        {contaAberta ? (
                          <button type="button" onClick={() => onRegistrarMovimento(conta)}
                            className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${isPagar ? ACTION_CLS_PAGAR : ACTION_CLS_RECEBER}`}>
                            {isPagar ? 'Pagar' : 'Receber'}
                          </button>
                        ) : (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(conta.status)}`}>{conta.status}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
          <span className="text-gray-600 dark:text-gray-300">Pagina {meta.page} de {meta.pages} ({meta.total} grupos)</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200">Anterior</button>
            <button type="button" disabled={page >= meta.pages} onClick={() => onPageChange(Math.min(meta.pages, page + 1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200">Proxima</button>
          </div>
        </div>
      )}
    </div>
  )
}
