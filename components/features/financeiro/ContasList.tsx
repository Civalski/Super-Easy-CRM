'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownCircle, ArrowUpCircle, Bell, ChevronDown, ChevronUp, Loader2, MoreVertical, Pencil, Percent } from '@/lib/icons'
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
  onAcrescentarTaxa?: (conta: ContaFinanceira) => void
  onAplicarMulta?: (conta: ContaFinanceira) => void
  onGerarLembrete?: (conta: ContaFinanceira) => void
  loading: boolean
}

const ACTION_CLS_RECEBER = 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
const ACTION_CLS_PAGAR = 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'

function podeAcrescentarTaxa(conta: ContaFinanceira) {
  const aberta = conta.status !== 'pago' && conta.status !== 'cancelado'
  return aberta && (conta.tipo === 'receber' || conta.status === 'atrasado')
}

function temMultaConfigurada(conta: ContaFinanceira) {
  return (conta.multaPorAtrasoPercentual != null && conta.multaPorAtrasoPercentual > 0) ||
    (conta.multaPorAtrasoValor != null && conta.multaPorAtrasoValor > 0)
}

function GrupoActions({
  grupo, isPagar, isExpanded, openMenuId, onToggleMenu,
  onRegistrarMovimento, onEditConta, onAcrescentarTaxa, onAplicarMulta, onGerarLembrete, onToggleExpand,
}: {
  grupo: GrupoContas; isPagar: boolean; isExpanded: boolean
  openMenuId: string | null; onToggleMenu: (id: string) => void
  onRegistrarMovimento: (c: ContaFinanceira) => void; onEditConta: (c: ContaFinanceira) => void
  onAcrescentarTaxa?: (c: ContaFinanceira) => void; onAplicarMulta?: (c: ContaFinanceira) => void
  onGerarLembrete?: (c: ContaFinanceira) => void; onToggleExpand: (id: string) => void
}) {
  const contaParaEditar = grupo.proximaContaAberta || grupo.contas[0]
  const contaParaAcoes = grupo.proximaContaAberta || grupo.contas[0]
  const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
  const actionColor = isPagar ? ACTION_CLS_PAGAR : ACTION_CLS_RECEBER
  const showTaxa = contaParaAcoes && podeAcrescentarTaxa(contaParaAcoes) && onAcrescentarTaxa
  const showAplicarMulta = contaParaAcoes && contaParaAcoes.status === 'atrasado' && temMultaConfigurada(contaParaAcoes) && onAplicarMulta
  const showLembrete = contaParaAcoes && contaParaAcoes.status !== 'pago' && contaParaAcoes.status !== 'cancelado' && onGerarLembrete
  const isOpen = openMenuId === grupo.id

  const menuItems = [
    grupo.proximaContaAberta && (
      <button key="receber" type="button" onClick={() => { onRegistrarMovimento(grupo.proximaContaAberta!); onToggleMenu('') }}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${actionColor}`}>
        {isPagar ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        {isPagar ? 'Pagar prox.' : 'Receber prox.'}
      </button>
    ),
    contaParaEditar && (
      <button key="editar" type="button" onClick={() => { onEditConta(contaParaEditar); onToggleMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
        <Pencil className="h-4 w-4" />Editar
      </button>
    ),
    showTaxa && (
      <button key="taxa" type="button" onClick={() => { onAcrescentarTaxa!(contaParaAcoes); onToggleMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20">
        <Percent className="h-4 w-4" />Acrescentar taxa
      </button>
    ),
    showAplicarMulta && (
      <button key="multa" type="button" onClick={() => { onAplicarMulta!(contaParaAcoes); onToggleMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/30">
        <Percent className="h-4 w-4" />Aplicar multa configurada
      </button>
    ),
    showLembrete && (
      <button key="lembrete" type="button" onClick={() => { onGerarLembrete!(contaParaAcoes); onToggleMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-900/20">
        <Bell className="h-4 w-4" />Gerar lembrete
      </button>
    ),
    isExpansivel && (
      <button key="expandir" type="button" onClick={() => { onToggleExpand(grupo.id); onToggleMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {isExpanded ? 'Ocultar' : grupo.isRecorrenteMensal ? `Lancamentos (${grupo.contas.length})` : `Parcelas ${grupo.totalParcelas}x`}
      </button>
    ),
  ].filter(Boolean)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggleMenu(isOpen ? '' : grupo.id)}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        title="Acoes"
        data-menu-btn={grupo.id}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && menuItems.length > 0 && typeof document !== 'undefined' && createPortal(
        <ContasMenuDropdown
          grupoId={grupo.id}
          menuItems={menuItems}
          onClose={() => onToggleMenu('')}
          triggerSelector={`[data-menu-btn="${grupo.id}"]`}
        />,
        document.body
      )}
    </div>
  )
}

function ContasMenuDropdown({ grupoId, menuItems, onClose, triggerSelector }: {
  grupoId: string; menuItems: React.ReactNode[]; onClose: () => void; triggerSelector: string
}) {
  const [pos, setPos] = useState<{ bottom: number; left: number } | null>(null)

  useEffect(() => {
    const update = () => {
      const btn = document.querySelector(triggerSelector) as HTMLElement
      if (btn) {
        const rect = btn.getBoundingClientRect()
        // Menu abre para cima (bottom) para não ser cortado no fim da página
        setPos({ bottom: window.innerHeight - rect.top + 4, left: Math.max(8, rect.right - 200) })
      }
    }
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      const btn = document.querySelector(triggerSelector)
      const menu = document.getElementById(`conta-menu-${grupoId}`)
      if (btn?.contains(t) || menu?.contains(t)) return
      onClose()
    }
    update()
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [grupoId, triggerSelector, onClose])

  if (!pos) return null
  return (
    <div
      id={`conta-menu-${grupoId}`}
      className="fixed z-[9999] w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      style={{ bottom: pos.bottom, left: pos.left }}
    >
      {menuItems}
    </div>
  )
}

function ParcelaRowActions({ conta, grupo, isPagar, openParcelaMenuId, onToggleParcelaMenu,
  onRegistrarMovimento, onEditConta, onAcrescentarTaxa, onAplicarMulta, onGerarLembrete }: {
  conta: ContaFinanceira; grupo: GrupoContas; isPagar: boolean
  openParcelaMenuId: string | null; onToggleParcelaMenu: (id: string) => void
  onRegistrarMovimento: (c: ContaFinanceira) => void; onEditConta: (c: ContaFinanceira) => void
  onAcrescentarTaxa?: (c: ContaFinanceira) => void; onAplicarMulta?: (c: ContaFinanceira) => void
  onGerarLembrete?: (c: ContaFinanceira) => void
}) {
  const contaAberta = conta.status !== 'pago' && conta.status !== 'cancelado'
  const showTaxa = contaAberta && podeAcrescentarTaxa(conta) && onAcrescentarTaxa
  const showAplicarMulta = contaAberta && conta.status === 'atrasado' && temMultaConfigurada(conta) && onAplicarMulta
  const showLembrete = contaAberta && onGerarLembrete
  const actionColor = isPagar ? ACTION_CLS_PAGAR : ACTION_CLS_RECEBER
  const isOpen = openParcelaMenuId === conta.id

  const menuItems = [
    contaAberta && (
      <button key="receber" type="button" onClick={() => { onRegistrarMovimento(conta); onToggleParcelaMenu('') }}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${actionColor}`}>
        {isPagar ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        {isPagar ? 'Pagar' : 'Receber'}
      </button>
    ),
    <button key="editar" type="button" onClick={() => { onEditConta(conta); onToggleParcelaMenu('') }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
      <Pencil className="h-4 w-4" />Editar
    </button>,
    showTaxa && (
      <button key="taxa" type="button" onClick={() => { onAcrescentarTaxa!(conta); onToggleParcelaMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20">
        <Percent className="h-4 w-4" />Acrescentar taxa
      </button>
    ),
    showAplicarMulta && (
      <button key="multa" type="button" onClick={() => { onAplicarMulta!(conta); onToggleParcelaMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/30">
        <Percent className="h-4 w-4" />Aplicar multa configurada
      </button>
    ),
    showLembrete && (
      <button key="lembrete" type="button" onClick={() => { onGerarLembrete!(conta); onToggleParcelaMenu('') }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-900/20">
        <Bell className="h-4 w-4" />Gerar lembrete
      </button>
    ),
  ].filter(Boolean)

  if (!contaAberta) {
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(conta.status)}`}>{conta.status}</span>
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => onToggleParcelaMenu(isOpen ? '' : conta.id)}
        className="inline-flex items-center justify-center rounded border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        title="Acoes" data-parcela-menu-btn={conta.id}>
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {isOpen && menuItems.length > 0 && typeof document !== 'undefined' && createPortal(
        <ContasMenuDropdown grupoId={conta.id} menuItems={menuItems} onClose={() => onToggleParcelaMenu('')}
          triggerSelector={`[data-parcela-menu-btn="${conta.id}"]`} />,
        document.body
      )}
    </div>
  )
}

function ParcelasDetail({
  grupo, isPagar, openParcelaMenuId, onToggleParcelaMenu,
  onRegistrarMovimento, onEditConta, onAcrescentarTaxa, onAplicarMulta, onGerarLembrete,
}: {
  grupo: GrupoContas; isPagar: boolean
  openParcelaMenuId: string | null; onToggleParcelaMenu: (id: string) => void
  onRegistrarMovimento: (c: ContaFinanceira) => void; onEditConta: (c: ContaFinanceira) => void
  onAcrescentarTaxa?: (c: ContaFinanceira) => void; onAplicarMulta?: (c: ContaFinanceira) => void
  onGerarLembrete?: (c: ContaFinanceira) => void
}) {
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
            <th className="px-2 py-1.5 text-right font-semibold">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {grupo.contas.map((conta) => (
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
                <ParcelaRowActions conta={conta} grupo={grupo} isPagar={isPagar}
                  openParcelaMenuId={openParcelaMenuId} onToggleParcelaMenu={onToggleParcelaMenu}
                  onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta}
                  onAcrescentarTaxa={onAcrescentarTaxa} onGerarLembrete={onGerarLembrete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const getVencimento = (g: GrupoContas) => {
  if (g.isRecorrenteMensal && g.primeiraData) return `Mensal (proximo: ${formatDate(g.primeiraData)})`
  if (g.primeiraData && g.ultimaData && g.primeiraData !== g.ultimaData)
    return `${formatDate(g.primeiraData)} a ${formatDate(g.ultimaData)}`
  return formatDate(g.primeiraData)
}

const getSubtitle = (g: GrupoContas) =>
  (g.isRecorrenteMensal ? 'Mensal automatica (sem data final)' : g.isParcelado ? `Parcelado em ${g.totalParcelas}x` : 'Conta unica')
  + (g.autoDebitoAtivo ? ' - debito automatico' : '')

const getParcelasLabel = (g: GrupoContas) =>
  g.isRecorrenteMensal ? 'Recorrente' : g.isParcelado ? `${g.parcelasPagas}/${g.totalParcelas}` : 'Unica'

export default function ContasList({
  gruposContas, meta, page, onPageChange, activeTipo, expandedGrupos,
  onToggleExpand, onRegistrarMovimento, onEditConta, onAcrescentarTaxa, onAplicarMulta, onGerarLembrete, loading,
}: ContasListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openParcelaMenuId, setOpenParcelaMenuId] = useState<string | null>(null)

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
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{grupo.isRecorrenteMensal ? `mensal: ${formatCurrency(grupo.valorTotal)}` : `de ${formatCurrency(grupo.valorTotal)}`}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(grupo.statusResumo)}`}>{grupo.statusResumo}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end">
                        <GrupoActions grupo={grupo} isPagar={isPagar} isExpanded={isExpanded}
                          openMenuId={openMenuId} onToggleMenu={(id) => setOpenMenuId(id || null)}
                          onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta}
                          onAcrescentarTaxa={onAcrescentarTaxa} onAplicarMulta={onAplicarMulta} onGerarLembrete={onGerarLembrete}
                          onToggleExpand={onToggleExpand} />
                      </div>
                    </td>
                  </tr>
                  {isExpansivel && isExpanded && (
                    <tr className="bg-gray-50/80 dark:bg-slate-900/45">
                      <td colSpan={7} className="px-3 py-2.5">
                        <ParcelasDetail grupo={grupo} isPagar={isPagar}
                          openParcelaMenuId={openParcelaMenuId} onToggleParcelaMenu={(id) => setOpenParcelaMenuId(id || null)}
                          onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta}
                          onAcrescentarTaxa={onAcrescentarTaxa} onAplicarMulta={onAplicarMulta} onGerarLembrete={onGerarLembrete} />
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
                <p className="col-span-2">{grupo.isRecorrenteMensal ? `Liquidado ${formatCurrency(grupo.valorRecebido)} (mensal: ${formatCurrency(grupo.valorTotal)})` : `Liquidado ${formatCurrency(grupo.valorRecebido)} de ${formatCurrency(grupo.valorTotal)}`}</p>
              </div>
              <div className="mt-2">
                <GrupoActions grupo={grupo} isPagar={isPagar} isExpanded={isExpanded}
                  openMenuId={openMenuId} onToggleMenu={(id) => setOpenMenuId(id || null)}
                  onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta}
                  onAcrescentarTaxa={onAcrescentarTaxa} onAplicarMulta={onAplicarMulta} onGerarLembrete={onGerarLembrete}
                  onToggleExpand={onToggleExpand} />
              </div>
              {isExpansivel && isExpanded && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-slate-900/50">
                  {grupo.contas.map((conta) => (
                    <div key={conta.id} className="flex items-center justify-between gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                      <div>
                        <p>{grupo.isRecorrenteMensal ? 'Lancamento' : 'Parcela'} {conta.numeroParcela || '-'}{!grupo.isRecorrenteMensal && grupo.totalParcelas ? `/${grupo.totalParcelas}` : ''} - {formatDate(conta.dataVencimento)}</p>
                        <p className="text-gray-500 dark:text-gray-400">{formatCurrency(conta.valorRecebido)} de {formatCurrency(conta.valorTotal)}</p>
                      </div>
                <ParcelaRowActions conta={conta} grupo={grupo} isPagar={isPagar}
                  openParcelaMenuId={openParcelaMenuId} onToggleParcelaMenu={(id) => setOpenParcelaMenuId(id || null)}
                  onRegistrarMovimento={onRegistrarMovimento} onEditConta={onEditConta}
                  onAcrescentarTaxa={onAcrescentarTaxa} onAplicarMulta={onAplicarMulta} onGerarLembrete={onGerarLembrete} />
                    </div>
                  ))}
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
