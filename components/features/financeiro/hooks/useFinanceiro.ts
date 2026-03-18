'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'
import type {
  AmbienteFinanceiro,
  AmbienteFinanceiroView,
  ContaFinanceira,
  CreateContaForm,
  EditContaForm,
  FinanceStats,
  FluxoData,
  GrupoContas,
  PaginationMeta,
} from '../types'
import { CONTAS_PAGE_SIZE } from '../constants'
import { getClienteNome, getContaTitulo, getSortDate, getStatusResumo, formatDateForInput, getDefaultDataVencimento, parseCurrencyInput } from '../utils'

const EMPTY_STATS: FinanceStats = { total: 0, receber: 0, pagar: 0, receberEmAberto: 0, pagarEmAberto: 0 }

export function useFinanceiro() {
  const { confirm, prompt } = useConfirm()
  const [loadingReceber, setLoadingReceber] = useState(true)
  const [loadingPagar, setLoadingPagar] = useState(true)
  const [contasReceber, setContasReceber] = useState<ContaFinanceira[]>([])
  const [contasPagar, setContasPagar] = useState<ContaFinanceira[]>([])
  const [pageReceber, setPageReceber] = useState(1)
  const [pagePagar, setPagePagar] = useState(1)
  const [metaReceber, setMetaReceber] = useState<PaginationMeta>({ total: 0, page: 1, limit: CONTAS_PAGE_SIZE, pages: 1 })
  const [metaPagar, setMetaPagar] = useState<PaginationMeta>({ total: 0, page: 1, limit: CONTAS_PAGE_SIZE, pages: 1 })
  const [stats, setStats] = useState<FinanceStats>(EMPTY_STATS)
  const [fluxo, setFluxo] = useState<FluxoData | null>(null)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [activeAmbiente, setActiveAmbiente] = useState<AmbienteFinanceiroView>('geral')
  const [activeTipo, setActiveTipo] = useState<'receber' | 'pagar'>('receber')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null)
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})

  const [createForm, setCreateForm] = useState<CreateContaForm>({
    ambiente: 'geral', tipo: 'receber', tipoVinculo: 'nenhum', entidadeId: '', descricao: '', valorTotal: '', dataVencimento: getDefaultDataVencimento(),
    autoDebito: false, parcelado: false, recorrenteMensal: false, parcelas: '2', intervaloDias: '30', datasParcelas: '',
    multaPorAtrasoAtiva: false, multaPorAtrasoTipo: 'percentual', multaPorAtrasoValor: '', multaPorAtrasoPeriodo: 'mes',
  })

  const [editForm, setEditForm] = useState<EditContaForm>({
    ambiente: 'geral', tipo: 'receber', tipoVinculo: 'nenhum', entidadeId: '', descricao: '', valorTotal: '', dataVencimento: '',
    autoDebito: true, recorrenciaAtiva: true, aplicarNoGrupoRecorrente: true,
  })

  const fetchReceberCountRef = useRef(0)
  const fetchPagarCountRef = useRef(0)

  const fetchContasTipo = useCallback(async (tipoFiltro: 'receber' | 'pagar', targetPage: number, ambienteFiltro: AmbienteFinanceiroView, signal?: AbortSignal) => {
    const fetchId = tipoFiltro === 'receber' ? ++fetchReceberCountRef.current : ++fetchPagarCountRef.current
    
    const setLoading = tipoFiltro === 'receber' ? setLoadingReceber : setLoadingPagar
    const setContas = tipoFiltro === 'receber' ? setContasReceber : setContasPagar
    const setMeta = tipoFiltro === 'receber' ? setMetaReceber : setMetaPagar
    const setPage = tipoFiltro === 'receber' ? setPageReceber : setPagePagar
    try {
      setLoading(true)
      const params = new URLSearchParams({ paginated: 'true', page: String(targetPage), limit: String(CONTAS_PAGE_SIZE), tipo: tipoFiltro, ambiente: ambienteFiltro })
      const res = await fetch(`/api/financeiro/contas-receber?${params.toString()}`, { signal })
      const payload = await res.json().catch(() => null)
      
      const currentRef = tipoFiltro === 'receber' ? fetchReceberCountRef.current : fetchPagarCountRef.current
      if (fetchId !== currentRef) return
      
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
      
      const currentRef = tipoFiltro === 'receber' ? fetchReceberCountRef.current : fetchPagarCountRef.current
      if (fetchId !== currentRef) return
      
      console.error('Erro ao carregar financeiro:', error)
      setContas([]); setMeta((p) => ({ ...p, total: 0, page: targetPage, pages: 1 }))
    } finally { 
      const currentRef = tipoFiltro === 'receber' ? fetchReceberCountRef.current : fetchPagarCountRef.current
      if (fetchId === currentRef) {
        setLoading(false) 
      }
    }
  }, [])

  const fetchFluxo = useCallback(async (ambienteFiltro: AmbienteFinanceiroView, signal?: AbortSignal) => {
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
    fetchContasTipo('receber', pageReceber, activeAmbiente, controller.signal)
    fetchContasTipo('pagar', pagePagar, activeAmbiente, controller.signal)
    return () => controller.abort()
  }, [fetchContasTipo, pageReceber, pagePagar, activeAmbiente])

  useEffect(() => {
    const controller = new AbortController()
    fetchFluxo(activeAmbiente, controller.signal)
    return () => controller.abort()
  }, [fetchFluxo, activeAmbiente])

  const buildGrupos = useCallback((contas: ContaFinanceira[]) => {
    const grouped = new Map<string, ContaFinanceira[]>()
    for (const c of contas) { const gid = c.grupoParcelaId || c.id; const g = grouped.get(gid); if (g) g.push(c); else grouped.set(gid, [c]) }

    return Array.from(grouped.entries()).map(([groupId, gc]) => {
      const sorted = [...gc].sort((a, b) => (a.numeroParcela ?? Infinity) - (b.numeroParcela ?? Infinity) || getSortDate(a.dataVencimento) - getSortDate(b.dataVencimento))
      const base = sorted[0]
      const datas = sorted.map((c) => c.dataVencimento).filter((d): d is string => Boolean(d)).sort((a, b) => getSortDate(a) - getSortDate(b))
      const isRec = sorted.some((c) => c.recorrenteMensal)
      const valorRecebidoSum = sorted.reduce((s, c) => s + c.valorRecebido, 0)
      return {
        id: groupId, contas: sorted, titulo: getContaTitulo(base), cliente: getClienteNome(base),
        isParcelado: sorted.length > 1 || (base?.totalParcelas ?? 0) > 1, isRecorrenteMensal: isRec,
        totalParcelas: base?.totalParcelas || sorted.length, parcelasPagas: sorted.filter((c) => c.status === 'pago').length,
        valorTotal: isRec ? (base?.valorTotal ?? 0) : sorted.reduce((s, c) => s + c.valorTotal, 0),
        valorRecebido: valorRecebidoSum,
        primeiraData: datas[0] ?? base?.dataVencimento ?? null, ultimaData: isRec ? null : (datas[datas.length - 1] ?? base?.dataVencimento ?? null),
        statusResumo: getStatusResumo(sorted), autoDebitoAtivo: sorted.some((c) => c.autoDebito),
        proximaContaAberta: sorted.find((c) => c.status !== 'pago' && c.status !== 'cancelado') || null,
      }
    }).sort((a, b) => getSortDate(a.primeiraData) - getSortDate(b.primeiraData))
  }, [])

  const gruposContasReceber = useMemo(() => buildGrupos(contasReceber), [buildGrupos, contasReceber])
  const gruposContasPagar = useMemo(() => buildGrupos(contasPagar), [buildGrupos, contasPagar])

  const refreshAll = async () => {
    await Promise.all([
      fetchContasTipo('receber', pageReceber, activeAmbiente),
      fetchContasTipo('pagar', pagePagar, activeAmbiente),
      fetchFluxo(activeAmbiente),
    ])
  }

  const toggleGrupoExpansao = (id: string) => setExpandedGrupos((p) => ({ ...p, [id]: !p[id] }))

  const createFormAmbiente: AmbienteFinanceiro = activeAmbiente === 'total' ? 'geral' : activeAmbiente
  const resetCreateForm = () => setCreateForm({ ambiente: createFormAmbiente, tipo: 'receber', tipoVinculo: 'nenhum', entidadeId: '', descricao: '', valorTotal: '', dataVencimento: getDefaultDataVencimento(), autoDebito: false, parcelado: false, recorrenteMensal: false, parcelas: '2', intervaloDias: '30', datasParcelas: '', multaPorAtrasoAtiva: false, multaPorAtrasoTipo: 'percentual', multaPorAtrasoValor: '', multaPorAtrasoPeriodo: 'mes' })

  const handleCreateConta = async (event: React.FormEvent) => {
    event.preventDefault()
    const descricao = createForm.descricao?.trim()
    if (!descricao) { toast.warning('Informe o nome da conta'); return }
    const valor = parseCurrencyInput(createForm.valorTotal)
    if (valor === null || valor <= 0) { toast.warning('Valor invalido'); return }

    const datasParcelas = createForm.datasParcelas.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
    const payload: Record<string, unknown> = { ambiente: createForm.ambiente, tipo: createForm.tipo, descricao, valorTotal: valor, dataVencimento: createForm.dataVencimento || null, autoDebito: createForm.tipo === 'pagar' ? createForm.autoDebito : false }
    if (createForm.multaPorAtrasoAtiva && createForm.multaPorAtrasoValor.trim()) {
      const multaVal = createForm.multaPorAtrasoTipo === 'valor'
        ? parseCurrencyInput(createForm.multaPorAtrasoValor)
        : Number(String(createForm.multaPorAtrasoValor).replace(',', '.'))
      if (multaVal !== null && Number.isFinite(multaVal) && multaVal > 0) {
        if (createForm.multaPorAtrasoTipo === 'percentual') payload.multaPorAtrasoPercentual = multaVal
        else payload.multaPorAtrasoValor = multaVal
        payload.multaPorAtrasoPeriodo = createForm.multaPorAtrasoPeriodo
      }
    }
    if (createForm.tipoVinculo === 'cliente' && createForm.entidadeId) payload.clienteId = createForm.entidadeId
    else if (createForm.tipoVinculo === 'fornecedor' && createForm.entidadeId) payload.fornecedorId = createForm.entidadeId
    else if (createForm.tipoVinculo === 'funcionario' && createForm.entidadeId) payload.funcionarioId = createForm.entidadeId

    if (createForm.recorrenteMensal && createForm.parcelado) {
      toast.warning('Escolha apenas uma opcao: parcelado ou mensal automatico')
      return
    }
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
      setShowCreateModal(false); resetCreateForm(); setPageReceber(1); setPagePagar(1); await refreshAll()
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

  const handleAcrescentarTaxa = async (conta: ContaFinanceira) => {
    const value = await prompt({ title: 'Acrescentar taxa', label: `Valor da taxa para ${conta.descricao || conta.id}`, placeholder: 'Ex: 50,00', confirmLabel: 'Acrescentar' })
    if (!value) return
    const valorTaxa = Number(String(value).replace(',', '.'))
    if (!Number.isFinite(valorTaxa) || valorTaxa <= 0) { toast.warning('Valor invalido'); return }
    try {
      const res = await fetch('/api/financeiro/contas-receber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conta.id, valorTaxa }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao acrescentar taxa')
      toast.success('Taxa acrescentada')
      await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao acrescentar taxa.' }) }
  }

  const handleAplicarMulta = async (conta: ContaFinanceira) => {
    const pct = conta.multaPorAtrasoPercentual
    const fixo = conta.multaPorAtrasoValor
    const periodo = conta.multaPorAtrasoPeriodo || 'mes'
    const diasPorPeriodo = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : 30
    const venc = conta.dataVencimento ? new Date(conta.dataVencimento).getTime() : 0
    const diasAtraso = venc > 0 ? Math.max(0, Math.floor((Date.now() - venc) / 86400000)) : 0
    const periodosAtraso = Math.max(1, Math.ceil(diasAtraso / diasPorPeriodo))
    let valorTaxa = 0
    if (pct != null && pct > 0) valorTaxa = Math.round((conta.valorTotal * pct / 100) * periodosAtraso * 100) / 100
    else if (fixo != null && fixo > 0) valorTaxa = Math.round(fixo * periodosAtraso * 100) / 100
    if (valorTaxa <= 0) { toast.warning('Multa nao configurada para esta conta'); return }
    try {
      const res = await fetch('/api/financeiro/contas-receber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conta.id, valorTaxa }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao aplicar multa')
      toast.success('Multa aplicada')
      await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao aplicar multa.' }) }
  }

  const handleGerarLembrete = async (conta: ContaFinanceira) => {
    const titulo = `Lembrete: ${conta.descricao || `Conta ${conta.id.slice(0, 8)}`}`
    const vencStr = conta.dataVencimento ? new Date(conta.dataVencimento).toISOString().slice(0, 10) : null
    const descricao = `Conta a ${conta.tipo === 'pagar' ? 'pagar' : 'receber'} - vencimento ${vencStr || 'a definir'}. Valor: R$ ${conta.valorTotal.toFixed(2).replace('.', ',')}.`
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          status: 'pendente',
          prioridade: 'alta',
          dataVencimento: vencStr || new Date().toISOString().slice(0, 10),
          clienteId: conta.cliente?.id || null,
          notificar: true,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar lembrete')
      toast.success('Lembrete criado')
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao gerar lembrete.' }) }
  }

  const handleOpenEditConta = (conta: ContaFinanceira) => {
    setEditingConta(conta)
    const tipoVinculo: 'nenhum' | 'cliente' | 'fornecedor' | 'funcionario' = conta.cliente ? 'cliente' : conta.fornecedor ? 'fornecedor' : conta.funcionario ? 'funcionario' : 'nenhum'
    const entidadeId = conta.cliente?.id || conta.fornecedor?.id || conta.funcionario?.id || ''
    setEditForm({ ambiente: conta.ambiente, tipo: conta.tipo, tipoVinculo, entidadeId, descricao: conta.descricao || '', valorTotal: String(conta.valorTotal), dataVencimento: formatDateForInput(conta.dataVencimento), autoDebito: conta.autoDebito, recorrenciaAtiva: conta.recorrenciaAtiva ?? true, aplicarNoGrupoRecorrente: true })
    setShowEditModal(true)
  }

  const handleEditConta = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingConta) return
    const valorTotal = Number(String(editForm.valorTotal).replace(',', '.'))
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) { toast.warning('Valor invalido'); return }
    try {
      setEditSaving(true)
      const patchPayload: Record<string, unknown> = { id: editingConta.id, ambiente: editForm.ambiente, tipo: editForm.tipo, descricao: editForm.descricao || null, valorTotal, dataVencimento: editForm.dataVencimento || null, autoDebito: editForm.tipo === 'pagar' ? editForm.autoDebito : false }
      if (editForm.tipoVinculo === 'cliente') patchPayload.clienteId = editForm.entidadeId || null
      else if (editForm.tipoVinculo === 'fornecedor') patchPayload.fornecedorId = editForm.entidadeId || null
      else if (editForm.tipoVinculo === 'funcionario') patchPayload.funcionarioId = editForm.entidadeId || null
      else { patchPayload.clienteId = null; patchPayload.fornecedorId = null; patchPayload.funcionarioId = null }
      if (editingConta.recorrenteMensal) Object.assign(patchPayload, { recorrenciaAtiva: editForm.recorrenciaAtiva, aplicarNoGrupoRecorrente: editForm.aplicarNoGrupoRecorrente })
      const res = await fetch('/api/financeiro/contas-receber', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patchPayload) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao editar conta')
      toast.success('Conta atualizada')
      setShowEditModal(false); setEditingConta(null); await refreshAll()
    } catch (err: unknown) { toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao editar conta.' }) }
    finally { setEditSaving(false) }
  }

  return {
    loading: loadingReceber || loadingPagar, stats, fluxo,
    metaReceber, metaPagar, pageReceber, pagePagar, setPageReceber, setPagePagar,
    loadingReceber, loadingPagar,
    activeAmbiente, setActiveAmbiente, activeTipo, setActiveTipo,
    gruposContasReceber, gruposContasPagar, expandedGrupos, toggleGrupoExpansao,
    showCreateModal, setShowCreateModal, saving, createForm, setCreateForm, handleCreateConta, resetCreateForm,
    showEditModal, setShowEditModal, editSaving, editingConta, setEditingConta, editForm, setEditForm, handleEditConta, handleOpenEditConta,
    handleRegistrarMovimento, handleAcrescentarTaxa, handleAplicarMulta, handleGerarLembrete,
    refreshAll,
  }
}
