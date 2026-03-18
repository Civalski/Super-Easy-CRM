'use client'

import { useEffect, useState } from 'react'
import { SideCreateDrawer } from '@/components/common'
import { ArrowDownCircle, ArrowUpCircle, Calendar, Loader2, X } from '@/lib/icons'
import { formatCurrency, formatMonthLabel } from '@/lib/format'
import type { ContaFinanceira, AmbienteFinanceiroView } from './types'

interface ContasMesDrawerProps {
  open: boolean
  onClose: () => void
  month: string | null
  ambiente: AmbienteFinanceiroView
}

const statusColors: Record<string, string> = {
  pago: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  parcial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  atrasado: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  cancelado: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  parcial: 'Parcial',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export default function ContasMesDrawer({ open, onClose, month, ambiente }: ContasMesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [receitas, setReceitas] = useState<ContaFinanceira[]>([])
  const [despesas, setDespesas] = useState<ContaFinanceira[]>([])
  const [tab, setTab] = useState<'receitas' | 'despesas'>('receitas')

  useEffect(() => {
    if (!open || !month) return

    const controller = new AbortController()
    setLoading(true)

    const fetchContas = async () => {
      try {
        const params = new URLSearchParams({
          month,
          ambiente,
          paginated: 'false',
          limit: '100'
        })
        const res = await fetch(`/api/financeiro/contas-receber?${params.toString()}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        if (Array.isArray(data)) {
          setReceitas(data.filter((c: ContaFinanceira) => c.tipo === 'receber'))
          setDespesas(data.filter((c: ContaFinanceira) => c.tipo === 'pagar'))
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Erro ao buscar contas do mês', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContas()

    return () => {
      controller.abort()
    }
  }, [open, month, ambiente])

  const list = tab === 'receitas' ? receitas : despesas
  const labelText = tab === 'receitas' ? 'Receitas' : 'Despesas'

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Detalhes de {month ? formatMonthLabel(month) : ''}
            </h2>
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

        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            type="button"
            onClick={() => setTab('receitas')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'receitas'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
            Receitas ({receitas.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('despesas')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'despesas'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <ArrowUpCircle className="h-4 w-4 text-rose-500" />
            Despesas ({despesas.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Nenhuma movimentação de {labelText.toLowerCase()} neste mês.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map((conta) => {
                const statusColor = statusColors[conta.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800'
                const statusLabel = statusLabels[conta.status] || conta.status
                const dataVenc = conta.dataVencimento ? new Date(conta.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'
                
                return (
                  <li
                    key={conta.id}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-xs dark:border-gray-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                        {conta.descricao || 'Sem descrição'}
                        {conta.numeroParcela && conta.totalParcelas && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({conta.numeroParcela}/{conta.totalParcelas})
                          </span>
                        )}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col gap-0.5">
                        <span>Vencimento: {dataVenc}</span>
                        {(conta.cliente || conta.fornecedor || conta.funcionario) && (
                          <span className="truncate max-w-[150px]">
                            {conta.cliente?.nome || conta.fornecedor?.nome || conta.funcionario?.nome}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tab === 'receitas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(conta.valorTotal)}
                        </p>
                        {conta.valorRecebido > 0 && conta.valorRecebido < conta.valorTotal && (
                          <p className="text-[10px]">
                            Pago: {formatCurrency(conta.valorRecebido)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </SideCreateDrawer>
  )
}
