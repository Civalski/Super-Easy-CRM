'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import type {
  AmbienteFinanceiro,
  ContaFinanceira,
  CreateContaForm,
  EditContaForm,
  FinanceStats,
  FluxoData,
  GrupoContas,
  PaginationMeta,
} from '../types'
import { CONTAS_PAGE_SIZE } from '../constants'
import { getClienteNome, getContaTitulo, getSortDate, getStatusResumo, formatDateForInput } from '../utils'

const EMPTY_STATS: FinanceStats = { total: 0, receber: 0, pagar: 0, receberEmAberto: 0, pagarEmAberto: 0 }

export function useFinanceiro() {
  const { confirm, prompt } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: CONTAS_PAGE_SIZE, pages: 1 })
  const [stats, setStats] = useState<FinanceStats>(EMPTY_STATS)
  const [fluxo, setFluxo] = useState<FluxoData | null>(null)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [activeAmbiente, setActiveAmbiente] = useState<AmbienteFinanceiro>('geral')
  const [activeTipo, setActiveTipo] = useState<'receber' | 'pagar'>('receber')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null)
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})

  const [createForm, setCreateForm] = useState<CreateContaForm>({
    ambiente: 'geral', tipo: 'receber', descricao: '', valorTotal: '', dataVencimento: '',
    autoDebito: true, parcelado: false, recorrenteMensal: false, parcelas: '2', intervaloDias: '30', datasParcelas: '',
  })

  const [editForm, setEditForm] = useState<EditContaForm>({
    ambiente: 'geral', tipo: 'receber', descricao: '', valorTotal: '', dataVencimento: '',
    autoDebito: true, recorrenciaAtiva: true, aplicarNoGrupoRecorrente: true,
  })

  const fetchContas = useCallback(async (targetPage: number, tipoFiltro: 'receber' | 'pagar', ambienteFiltro: AmbienteFinanceiro, signal?: AbortSignal) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ paginated: 'true', page: String(targetPage), limit: String(CONTAS_PAGE_SIZE), tipo: tipoFiltro, ambiente: ambienteFiltro })
      const res = await fetch(`/api/financeiro/contas-receber?${params.toString()}`, { signal })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar contas financeiras')

      const nextContas = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = { total: Number(payload?.meta?.total || 0), page: Number(payload?.meta?.page || targetPage), limit: Number(payload?.meta?.limit || CONTAS_PAGE_SIZE), pages: Number(payload?.meta?.pages || 1) }

      if (nextContas.length === 0 && targetPage > 1 && nextMeta.total > 0) { setPage((p) => Math.max(1, p - 1)); return }

      setContas(nextContas)
      setMeta(nextMeta)
      setStats({
        total: Number(payload?.stats?.total || 0), receber: Number(payload?.stats?.receber || 0),
        pagar: Number(payload?.stats?.pagar || 0), receberEmAberto: Number(payload?.stats?.receberEmAberto || 0),
        pagarEmAberto: Number(payload?.stats?.pagarEmAberto || 0),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao carregar financeiro:', error)
      setContas([]); setMeta((p) => ({ ...p, total: 0, page: targetPage, pages: 1 })); setStats(EMPTY_STATS)
    } finally { setLoading(false) }
  }, [])

  const fetchFluxo = useCallback(async (ambienteFiltro: AmbienteFinanceiro, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/financeiro/fluxo-caixa?months=6&ambiente=${ambienteFiltro}`, { signal })
      const data = await res.json().catch(() => null)
      setFluxo(data && typeof data === 'object' ? data : null)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Erro ao carregar fluxo de caixa:', error); setFluxo(null)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchContas(page, activeTipo, activeAmbiente, controller.signal)
    return () => controller.abort()
  }, [fetchContas, page, activeTipo, activeAmbiente])

  useEffect(() => {
    const controller = new AbortController()
    fetchFluxo(activeAmbiente, controller.signal)
    return () => controller.abort()
  }, [fetchFluxo, activeAmbiente])

  const gruposContas = useMemo<GrupoContas[]>(() => {
    const grouped = new Map<string, ContaFinanceira[]>()
    for (const c of contas) { const gid = c.grupoParcelaId || c.id; const g = grouped.get(gid); if (g) g.push(c); else grouped.set(gid, [c]) }

    return Array.from(grouped.entries()).map(([groupId, gc]) => {
      const sorted = [...gc].sort((a, b) => (a.numeroParcela ?? Infinity) - (b.numeroParcela ?? Infinity) || getSortDate(a.dataVencimento) - getSortDate(b.dataVencimento))
      const base = sorted[0]
      const datas = sorted.map((c) => c.dataVencimento).filter((d): d is string => Boolean(d)).sort((a, b) => getSortDate(a) - getSortDate(b))
      const isRec = sorted.some((c) => c.recorrenteMensal)
      return {
        id: groupId, contas: sorted, titulo: getContaTitulo(base), cliente: getClienteNome(base),
        isParcelado: sorted.length > 1 || (base?.totalParcelas ?? 0) > 1, isRecorrenteMensal: isRec,
        totalParcelas: base?.totalParcelas || sorted.length, parcelasPagas: sorted.filter((c) => c.status === 'pago').length,
        valorTotal: sorted.reduce((s, c) => s + c.valorTotal, 0), valorRecebido: sorted.reduce((s, c) => s + c.valorRecebido, 0),
        primeiraData: datas[0] ?? base?.dataVencimento ?? null, ultimaData: datas[datas.length - 1] ?? base?.dataVencimento ?? null,
        statusResumo: getStatusResumo(sorted), autoDebitoAtivo: sorted.some((c) => c.autoDebito),
        proximaContaAberta: sorted.find((c) => c.status !== 'pago' && c.status !== 'cancelado') || null,
      }
    }).sort((a, b) => getSortDate(a.primeiraData) - getSortDate(b.primeiraData))
  }, [contas])

  const refreshAll = async () => { await Promise.all([fetchContas(page, activeTipo, activeAmbiente), fetchFluxo(activeAmbiente)]) }

  const toggleGrupoExpansao = (id: string) => setExpandedGrupos((p) => ({ ...p, [id]: !p[id] }))

  const resetCreateForm = () => setCreateForm({ ambiente: activeAmbiente, tipo: 'receber', descricao: '', valorTotal: '', dataVencimento: '', autoDebito: true, parcelado: false, recorrenteMensal: false, parcelas: '2', intervaloDias: '30', datasParcelas: '' })

  const handleCreateConta = async (event: React.FormEvent) => {
    event.preventDefault()
    const valor = Number(String(createForm.valorTotal).replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) { toast.warning('Valor invalido'); return }

    const datasParcelas = createForm.datasParcelas.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
    const payload: Record<string, unknown> = { ambiente: createForm.ambiente, tipo: createForm.tipo, descricao: createForm.descricao || null, valorTotal: valor, dataVencimento: createForm.dataVencimento || null, autoDebito: createForm.tipo === 'pagar' ? createForm.autoDebito : false }

    if (createForm.recorrenteMensal) {
      if (!createForm.dataVencimento) { toast.warning('Informe o primeiro vencimento da recorrencia'); return }
      payload.recorrenteMensal = true
    } else if (createForm.parcelado) {
      if (datasParcelas.length > 0) { payload.parcelasDatas = datasParcelas }
      else {
        const parcelas = Number(createForm.parcelas)
        if (!Number.isInteger(parcelas) || parcelas < 2) { toast.warning('Parcelas invalidas'); return }
        if (!createForm.dataVencimento) { toast.warning('Informe a primeira data de vencimento'); return }
        payload.parcelas = parcelas; payload.intervaloDias = Number(createForm.intervaloDias || '30')
      }
    }

    try {
      setSaving(true)
      const res = await fetch('/api/financeiro/contas-receber', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar conta')
      toast.success('Conta criada', { description: typeof data?.parcelasCriadas === 'number' ? `${data.parcelasCriadas} parcelas criadas com sucesso.` : typeof data?.lancamentosCriados === 'number' ? `${data.lancamentosCriados} lancamentos mensais criados para a recorrencia.` : undefined })
      setShowCreateModal(false); resetCreateForm(); setPage(1); await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao criar conta.' }) }
    finally { setSaving(false) }
  }

  const handleRegistrarMovimento = async (conta: ContaFinanceira) => {
    const isPagar = conta.tipo === 'pagar'
    const value = await prompt({ title: isPagar ? 'Registrar Pagamento' : 'Registrar Recebimento', label: `${isPagar ? 'Valor pago' : 'Valor recebido'} para ${conta.descricao || conta.id}`, placeholder: 'Ex: 1500,00', confirmLabel: isPagar ? 'Registrar pagamento' : 'Registrar recebimento' })
    if (!value) return
    const valorMov = Number(String(value).replace(',', '.'))
    if (!Number.isFinite(valorMov) || valorMov <= 0) { toast.warning('Valor invalido'); return }
    try {
      const res = await fetch('/api/financeiro/contas-receber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conta.id, valorRecebido: Math.min(conta.valorTotal, conta.valorRecebido + valorMov), registrarMovimento: true, valorMovimento: valorMov, tipoMovimento: isPagar ? 'saida' : 'entrada', observacoesMovimento: isPagar ? 'Pagamento manual via tela financeira' : 'Recebimento manual via tela financeira' }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao registrar movimento')
      await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao registrar movimento.' }) }
  }

  const handleOpenEditConta = (conta: ContaFinanceira) => {
    setEditingConta(conta)
    setEditForm({ ambiente: conta.ambiente, tipo: conta.tipo, descricao: conta.descricao || '', valorTotal: String(conta.valorTotal), dataVencimento: formatDateForInput(conta.dataVencimento), autoDebito: conta.autoDebito, recorrenciaAtiva: conta.recorrenciaAtiva ?? true, aplicarNoGrupoRecorrente: true })
    setShowEditModal(true)
  }

  const handleEditConta = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingConta) return
    const valorTotal = Number(String(editForm.valorTotal).replace(',', '.'))
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) { toast.warning('Valor invalido'); return }
    try {
      setEditSaving(true)
      const res = await fetch('/api/financeiro/contas-receber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingConta.id, ambiente: editForm.ambiente, tipo: editForm.tipo, descricao: editForm.descricao || null, valorTotal, dataVencimento: editForm.dataVencimento || null, autoDebito: editForm.tipo === 'pagar' ? editForm.autoDebito : false, ...(editingConta.recorrenteMensal ? { recorrenciaAtiva: editForm.recorrenciaAtiva, aplicarNoGrupoRecorrente: editForm.aplicarNoGrupoRecorrente } : {}) }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao editar conta')
      toast.success('Conta atualizada')
      setShowEditModal(false); setEditingConta(null); await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao editar conta.' }) }
    finally { setEditSaving(false) }
  }

  return {
    loading, stats, fluxo, meta, page, setPage,
    activeAmbiente, setActiveAmbiente, activeTipo, setActiveTipo,
    gruposContas, expandedGrupos, toggleGrupoExpansao,
    showCreateModal, setShowCreateModal, saving, createForm, setCreateForm, handleCreateConta, resetCreateForm,
    showEditModal, setShowEditModal, editSaving, editingConta, setEditingConta, editForm, setEditForm, handleEditConta, handleOpenEditConta,
    handleRegistrarMovimento,
  }
}
