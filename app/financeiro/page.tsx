'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LineChart,
  Wallet,
  Loader2,
  PlusCircle,
  X,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react'
import Swal from 'sweetalert2'

type AmbienteFinanceiro = 'geral' | 'pessoal'

interface ContaFinanceira {
  id: string
  ambiente: AmbienteFinanceiro
  tipo: 'receber' | 'pagar'
  descricao: string | null
  valorTotal: number
  valorRecebido: number
  status: string
  autoDebito: boolean
  numeroParcela: number | null
  totalParcelas: number | null
  grupoParcelaId: string | null
  recorrenteMensal: boolean
  recorrenciaAtiva: boolean
  recorrenciaDiaVencimento: number | null
  dataVencimento: string | null
  pedido?: {
    oportunidade?: {
      titulo: string
      cliente?: {
        nome: string
      }
    }
  } | null
}

interface FluxoSerie {
  month: string
  recebido: number
  saida: number
  previsto: number
  previstoReceber: number
  previstoPagar: number
  estornado: number
  saldo: number
  saldoProjetado: number
}

interface FluxoData {
  totals: {
    recebido: number
    saida: number
    previsto: number
    previstoReceber: number
    previstoPagar: number
    estornado: number
    saldo: number
    saldoProjetado: number
  }
  series: FluxoSerie[]
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

interface FinanceStats {
  total: number
  receber: number
  pagar: number
  receberEmAberto: number
  pagarEmAberto: number
}

interface GrupoContas {
  id: string
  contas: ContaFinanceira[]
  titulo: string
  cliente: string
  isParcelado: boolean
  isRecorrenteMensal: boolean
  totalParcelas: number
  parcelasPagas: number
  valorTotal: number
  valorRecebido: number
  primeiraData: string | null
  ultimaData: string | null
  statusResumo: string
  autoDebitoAtivo: boolean
  proximaContaAberta: ContaFinanceira | null
}

const CONTAS_PAGE_SIZE = 12
const AMBIENTE_LABEL: Record<AmbienteFinanceiro, string> = {
  geral: 'Fluxo total',
  pessoal: 'Fluxo pessoal',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const formatMonthLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value

  const year = match[1]
  const monthIndex = Number(match[2]) - 1
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  return `${year}/${months[monthIndex] || match[2]}`
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const formatDateForInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const getContaTitulo = (conta: ContaFinanceira) =>
  conta.descricao || conta.pedido?.oportunidade?.titulo || `Conta ${conta.id}`

const getClienteNome = (conta: ContaFinanceira) => conta.pedido?.oportunidade?.cliente?.nome || '-'

const getSortDate = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

const getStatusResumo = (contas: ContaFinanceira[]) => {
  if (contas.length === 0) return 'pendente'
  if (contas.every((item) => item.status === 'cancelado')) return 'cancelado'
  if (contas.every((item) => item.status === 'pago')) return 'pago'
  if (contas.some((item) => item.status === 'atrasado')) return 'atrasado'
  if (contas.some((item) => item.status === 'pago')) return 'parcial'
  return contas[0]?.status || 'pendente'
}

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: CONTAS_PAGE_SIZE,
    pages: 1,
  })
  const [stats, setStats] = useState<FinanceStats>({
    total: 0,
    receber: 0,
    pagar: 0,
    receberEmAberto: 0,
    pagarEmAberto: 0,
  })
  const [fluxo, setFluxo] = useState<FluxoData | null>(null)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [activeAmbiente, setActiveAmbiente] = useState<AmbienteFinanceiro>('geral')
  const [activeTipo, setActiveTipo] = useState<'receber' | 'pagar'>('receber')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isDomReady, setIsDomReady] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConta, setEditingConta] = useState<ContaFinanceira | null>(null)
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})
  const [createForm, setCreateForm] = useState({
    ambiente: 'geral' as AmbienteFinanceiro,
    tipo: 'receber' as 'receber' | 'pagar',
    descricao: '',
    valorTotal: '',
    dataVencimento: '',
    autoDebito: true,
    parcelado: false,
    recorrenteMensal: false,
    parcelas: '2',
    intervaloDias: '30',
    datasParcelas: '',
  })
  const [editForm, setEditForm] = useState({
    ambiente: 'geral' as AmbienteFinanceiro,
    tipo: 'receber' as 'receber' | 'pagar',
    descricao: '',
    valorTotal: '',
    dataVencimento: '',
    autoDebito: true,
    recorrenciaAtiva: true,
    aplicarNoGrupoRecorrente: true,
  })

  const fetchContas = useCallback(
    async (targetPage: number, tipoFiltro: 'receber' | 'pagar', ambienteFiltro: AmbienteFinanceiro) => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          paginated: 'true',
          page: String(targetPage),
          limit: String(CONTAS_PAGE_SIZE),
          tipo: tipoFiltro,
          ambiente: ambienteFiltro,
        })
        const contasRes = await fetch(`/api/financeiro/contas-receber?${params.toString()}`)
        const payload = await contasRes.json().catch(() => null)

        if (!contasRes.ok) {
          throw new Error(payload?.error || 'Erro ao carregar contas financeiras')
        }

        const nextContas = Array.isArray(payload?.data) ? payload.data : []
        const nextMeta: PaginationMeta = {
          total: Number(payload?.meta?.total || 0),
          page: Number(payload?.meta?.page || targetPage),
          limit: Number(payload?.meta?.limit || CONTAS_PAGE_SIZE),
          pages: Number(payload?.meta?.pages || 1),
        }

        if (nextContas.length === 0 && targetPage > 1 && nextMeta.total > 0) {
          setPage((prev) => Math.max(1, prev - 1))
          return
        }

        setContas(nextContas)
        setMeta(nextMeta)
        setStats({
          total: Number(payload?.stats?.total || 0),
          receber: Number(payload?.stats?.receber || 0),
          pagar: Number(payload?.stats?.pagar || 0),
          receberEmAberto: Number(payload?.stats?.receberEmAberto || 0),
          pagarEmAberto: Number(payload?.stats?.pagarEmAberto || 0),
        })
      } catch (error) {
        console.error('Erro ao carregar financeiro:', error)
        setContas([])
        setMeta((prev) => ({ ...prev, total: 0, page: targetPage, pages: 1 }))
        setStats({
          total: 0,
          receber: 0,
          pagar: 0,
          receberEmAberto: 0,
          pagarEmAberto: 0,
        })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchFluxo = useCallback(async (ambienteFiltro: AmbienteFinanceiro) => {
    try {
      const params = new URLSearchParams({
        months: '6',
        ambiente: ambienteFiltro,
      })
      const fluxoRes = await fetch(`/api/financeiro/fluxo-caixa?${params.toString()}`)
      const fluxoData = await fluxoRes.json().catch(() => null)
      setFluxo(fluxoData && typeof fluxoData === 'object' ? fluxoData : null)
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error)
      setFluxo(null)
    }
  }, [])

  useEffect(() => {
    fetchContas(page, activeTipo, activeAmbiente)
  }, [fetchContas, page, activeTipo, activeAmbiente])

  useEffect(() => {
    fetchFluxo(activeAmbiente)
  }, [fetchFluxo, activeAmbiente])

  useEffect(() => {
    setIsDomReady(true)
  }, [])

  const contasFiltradas = contas
  const gruposContas = useMemo<GrupoContas[]>(() => {
    const grouped = new Map<string, ContaFinanceira[]>()

    for (const conta of contasFiltradas) {
      const groupId = conta.grupoParcelaId || conta.id
      const group = grouped.get(groupId)
      if (group) {
        group.push(conta)
      } else {
        grouped.set(groupId, [conta])
      }
    }

    return Array.from(grouped.entries())
      .map(([groupId, contasDoGrupo]) => {
        const contasOrdenadas = [...contasDoGrupo].sort((a, b) => {
          const parcelaA = a.numeroParcela ?? Number.MAX_SAFE_INTEGER
          const parcelaB = b.numeroParcela ?? Number.MAX_SAFE_INTEGER
          if (parcelaA !== parcelaB) return parcelaA - parcelaB
          return getSortDate(a.dataVencimento) - getSortDate(b.dataVencimento)
        })

        const contaBase = contasOrdenadas[0]
        const datasOrdenadas = contasOrdenadas
          .map((conta) => conta.dataVencimento)
          .filter((item): item is string => Boolean(item))
          .sort((a, b) => getSortDate(a) - getSortDate(b))

        const isRecorrenteMensal = contasOrdenadas.some((item) => item.recorrenteMensal)
        const isParcelado = contasOrdenadas.length > 1 || (contaBase?.totalParcelas ?? 0) > 1

        return {
          id: groupId,
          contas: contasOrdenadas,
          titulo: getContaTitulo(contaBase),
          cliente: getClienteNome(contaBase),
          isParcelado,
          isRecorrenteMensal,
          totalParcelas: contaBase?.totalParcelas || contasOrdenadas.length,
          parcelasPagas: contasOrdenadas.filter((item) => item.status === 'pago').length,
          valorTotal: contasOrdenadas.reduce((sum, item) => sum + item.valorTotal, 0),
          valorRecebido: contasOrdenadas.reduce((sum, item) => sum + item.valorRecebido, 0),
          primeiraData: datasOrdenadas[0] ?? contaBase?.dataVencimento ?? null,
          ultimaData: datasOrdenadas[datasOrdenadas.length - 1] ?? contaBase?.dataVencimento ?? null,
          statusResumo: getStatusResumo(contasOrdenadas),
          autoDebitoAtivo: contasOrdenadas.some((item) => item.autoDebito),
          proximaContaAberta:
            contasOrdenadas.find((item) => item.status !== 'pago' && item.status !== 'cancelado') || null,
        }
      })
      .sort((a, b) => getSortDate(a.primeiraData) - getSortDate(b.primeiraData))
  }, [contasFiltradas])

  const getStatusClass = (status: string) => {
    if (status === 'pago') {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    }
    if (status === 'atrasado') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }
    if (status === 'cancelado') {
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
    }
    if (status === 'parcial') {
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
    }
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  }

  const toggleGrupoExpansao = (grupoId: string) => {
    setExpandedGrupos((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }))
  }

  const resetCreateForm = () => {
    setCreateForm({
      ambiente: activeAmbiente,
      tipo: 'receber',
      descricao: '',
      valorTotal: '',
      dataVencimento: '',
      autoDebito: true,
      parcelado: false,
      recorrenteMensal: false,
      parcelas: '2',
      intervaloDias: '30',
      datasParcelas: '',
    })
  }

  const handleCreateConta = async (event: React.FormEvent) => {
    event.preventDefault()

    const valor = Number(String(createForm.valorTotal).replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) {
      await Swal.fire({ icon: 'warning', title: 'Valor invalido' })
      return
    }

    const datasParcelas = createForm.datasParcelas
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
      ambiente: createForm.ambiente,
      tipo: createForm.tipo,
      descricao: createForm.descricao || null,
      valorTotal: valor,
      dataVencimento: createForm.dataVencimento || null,
      autoDebito: createForm.tipo === 'pagar' ? createForm.autoDebito : false,
    }

    if (createForm.recorrenteMensal) {
      if (!createForm.dataVencimento) {
        await Swal.fire({ icon: 'warning', title: 'Informe o primeiro vencimento da recorrencia' })
        return
      }
      payload.recorrenteMensal = true
    } else if (createForm.parcelado) {
      if (datasParcelas.length > 0) {
        payload.parcelasDatas = datasParcelas
      } else {
        const parcelas = Number(createForm.parcelas)
        if (!Number.isInteger(parcelas) || parcelas < 2) {
          await Swal.fire({ icon: 'warning', title: 'Parcelas invalidas' })
          return
        }
        if (!createForm.dataVencimento) {
          await Swal.fire({ icon: 'warning', title: 'Informe a primeira data de vencimento' })
          return
        }
        payload.parcelas = parcelas
        payload.intervaloDias = Number(createForm.intervaloDias || '30')
      }
    }

    try {
      setSaving(true)
      const response = await fetch('/api/financeiro/contas-receber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao criar conta')

      await Swal.fire({
        icon: 'success',
        title: 'Conta criada',
        text:
          typeof data?.parcelasCriadas === 'number'
            ? `${data.parcelasCriadas} parcelas criadas com sucesso.`
            : typeof data?.lancamentosCriados === 'number'
              ? `${data.lancamentosCriados} lancamentos mensais criados para a recorrencia.`
            : undefined,
      })

      setShowCreateModal(false)
      resetCreateForm()
      setPage(1)
      await Promise.all([fetchContas(1, activeTipo, activeAmbiente), fetchFluxo(activeAmbiente)])
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao criar conta.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRegistrarMovimento = async (conta: ContaFinanceira) => {
    const isPagar = conta.tipo === 'pagar'

    const result = await Swal.fire({
      title: isPagar ? 'Registrar Pagamento' : 'Registrar Recebimento',
      input: 'text',
      inputLabel: `${isPagar ? 'Valor pago' : 'Valor recebido'} para ${conta.descricao || conta.id}`,
      inputPlaceholder: 'Ex: 1500,00',
      showCancelButton: true,
      confirmButtonText: isPagar ? 'Registrar pagamento' : 'Registrar recebimento',
    })
    if (!result.isConfirmed || !result.value) return

    const valorMovimento = Number(String(result.value).replace(',', '.'))
    if (!Number.isFinite(valorMovimento) || valorMovimento <= 0) {
      await Swal.fire({ icon: 'warning', title: 'Valor invalido' })
      return
    }

    const novoValorRecebido = Math.min(conta.valorTotal, conta.valorRecebido + valorMovimento)

    try {
      const response = await fetch('/api/financeiro/contas-receber', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conta.id,
          valorRecebido: novoValorRecebido,
          registrarMovimento: true,
          valorMovimento,
          tipoMovimento: isPagar ? 'saida' : 'entrada',
          observacoesMovimento: isPagar
            ? 'Pagamento manual via tela financeira'
            : 'Recebimento manual via tela financeira',
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao registrar movimento')
      await Promise.all([fetchContas(page, activeTipo, activeAmbiente), fetchFluxo(activeAmbiente)])
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao registrar movimento.',
      })
    }
  }

  const handleOpenEditConta = (conta: ContaFinanceira) => {
    setEditingConta(conta)
    setEditForm({
      ambiente: conta.ambiente,
      tipo: conta.tipo,
      descricao: conta.descricao || '',
      valorTotal: String(conta.valorTotal),
      dataVencimento: formatDateForInput(conta.dataVencimento),
      autoDebito: conta.autoDebito,
      recorrenciaAtiva: conta.recorrenciaAtiva ?? true,
      aplicarNoGrupoRecorrente: true,
    })
    setShowEditModal(true)
  }

  const handleEditConta = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editingConta) return

    const valorTotal = Number(String(editForm.valorTotal).replace(',', '.'))
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      await Swal.fire({ icon: 'warning', title: 'Valor invalido' })
      return
    }

    try {
      setEditSaving(true)
      const response = await fetch('/api/financeiro/contas-receber', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConta.id,
          ambiente: editForm.ambiente,
          tipo: editForm.tipo,
          descricao: editForm.descricao || null,
          valorTotal,
          dataVencimento: editForm.dataVencimento || null,
          autoDebito: editForm.tipo === 'pagar' ? editForm.autoDebito : false,
          ...(editingConta.recorrenteMensal
            ? {
                recorrenciaAtiva: editForm.recorrenciaAtiva,
                aplicarNoGrupoRecorrente: editForm.aplicarNoGrupoRecorrente,
              }
            : {}),
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Erro ao editar conta')

      await Swal.fire({
        icon: 'success',
        title: 'Conta atualizada',
      })
      setShowEditModal(false)
      setEditingConta(null)
      await Promise.all([fetchContas(page, activeTipo, activeAmbiente), fetchFluxo(activeAmbiente)])
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Erro ao editar conta.',
      })
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-purple-700 to-fuchsia-700 p-2.5 shadow-lg shadow-purple-900/35">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contas a receber, contas a pagar e previsao de caixa em {AMBIENTE_LABEL[activeAmbiente].toLowerCase()}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateForm((prev) => ({ ...prev, ambiente: activeAmbiente }))
            setShowCreateModal(true)
          }}
          disabled={saving}
          className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </button>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-gray-200 p-1 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            setActiveAmbiente('geral')
            setPage(1)
            setExpandedGrupos({})
          }}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeAmbiente === 'geral'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Fluxo total
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveAmbiente('pessoal')
            setPage(1)
            setExpandedGrupos({})
          }}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeAmbiente === 'pessoal'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Fluxo pessoal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de contas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Contas a receber</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.receber}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Contas a pagar</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.pagar}</p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Receber em aberto</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.receberEmAberto)}
          </p>
        </div>
        <div className="crm-card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pagar em aberto</p>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.pagarEmAberto)}
          </p>
        </div>
      </div>

      <div className="crm-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <LineChart className="h-5 w-5 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Fluxo de Caixa (6 meses) - {AMBIENTE_LABEL[activeAmbiente]}
          </h2>
        </div>

        {fluxo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recebido</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(fluxo.totals.recebido)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Pago</p>
                <p className="font-semibold text-rose-600 dark:text-rose-400">
                  {formatCurrency(fluxo.totals.saida)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Previsto receber</p>
                <p className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {formatCurrency(fluxo.totals.previstoReceber)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Previsto pagar</p>
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(fluxo.totals.previstoPagar)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Saldo projetado</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(fluxo.totals.saldoProjetado)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="px-2 py-2">Mes</th>
                    <th className="px-2 py-2">Recebido</th>
                    <th className="px-2 py-2">Pago</th>
                    <th className="px-2 py-2">Prev. receber</th>
                    <th className="px-2 py-2">Prev. pagar</th>
                    <th className="px-2 py-2">Saldo proj.</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.series.map((item) => (
                    <tr key={item.month} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-2 text-gray-800 dark:text-gray-100">{formatMonthLabel(item.month)}</td>
                      <td className="px-2 py-2 text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.recebido)}
                      </td>
                      <td className="px-2 py-2 text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.saida)}
                      </td>
                      <td className="px-2 py-2 text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(item.previstoReceber)}
                      </td>
                      <td className="px-2 py-2 text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.previstoPagar)}
                      </td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-300">
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

      <div className="crm-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Contas - {AMBIENTE_LABEL[activeAmbiente]}
          </h2>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setActiveTipo('receber')
                setPage(1)
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTipo === 'receber'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              Receber
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTipo('pagar')
                setPage(1)
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTipo === 'pagar'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              Pagar
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[120px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        )}

        {!loading && gruposContas.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conta registrada.</p>
        )}

        {!loading && gruposContas.length > 0 && (
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
                    const isPagar = activeTipo === 'pagar'
                    const isExpanded = Boolean(expandedGrupos[grupo.id])
                    const contaParaEditar = grupo.proximaContaAberta || grupo.contas[0]
                    const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
                    const vencimento =
                      grupo.primeiraData && grupo.ultimaData && grupo.primeiraData !== grupo.ultimaData
                        ? `${formatDate(grupo.primeiraData)} a ${formatDate(grupo.ultimaData)}`
                        : formatDate(grupo.primeiraData)

                    return (
                      <tbody key={grupo.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                        <tr className="align-top">
                          <td className="px-3 py-2.5">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {grupo.titulo}
                            </p>
                            <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                              {grupo.isRecorrenteMensal
                                ? 'Mensal automatica (sem data final)'
                                : grupo.isParcelado
                                  ? `Parcelado em ${grupo.totalParcelas}x`
                                  : 'Conta unica'}
                              {grupo.autoDebitoAtivo ? ' - debito automatico' : ''}
                            </p>
                          </td>
                          <td className="truncate px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">
                            {grupo.cliente}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200">
                            {grupo.isRecorrenteMensal
                              ? `${grupo.parcelasPagas}/${grupo.contas.length}`
                              : grupo.isParcelado
                                ? `${grupo.parcelasPagas}/${grupo.totalParcelas}`
                                : 'Unica'}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300">{vencimento}</td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-100">
                              {formatCurrency(grupo.valorRecebido)}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              de {formatCurrency(grupo.valorTotal)}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(grupo.statusResumo)}`}
                            >
                              {grupo.statusResumo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {grupo.proximaContaAberta && (
                                <button
                                  type="button"
                                  onClick={() => handleRegistrarMovimento(grupo.proximaContaAberta!)}
                                  className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    isPagar
                                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'
                                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                  }`}
                                >
                                  {isPagar ? (
                                    <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                                  ) : (
                                    <ArrowDownCircle className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  {isPagar ? 'Pagar prox.' : 'Receber prox.'}
                                </button>
                              )}
                              {contaParaEditar && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditConta(contaParaEditar)}
                                  className="inline-flex items-center rounded-lg border border-indigo-300 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                                >
                                  <Pencil className="mr-1 h-3.5 w-3.5" />
                                  Editar
                                </button>
                              )}
                              {isExpansivel && (
                                <button
                                  type="button"
                                  onClick={() => toggleGrupoExpansao(grupo.id)}
                                  className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                  {isExpanded
                                    ? 'Ocultar'
                                    : grupo.isRecorrenteMensal
                                      ? `Lancamentos (${grupo.contas.length})`
                                      : `Parcelas ${grupo.totalParcelas}x`}
                                  {isExpanded ? (
                                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpansivel && isExpanded && (
                          <tr className="bg-gray-50/80 dark:bg-slate-900/45">
                            <td colSpan={7} className="px-3 py-2.5">
                              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-100 text-left text-[10px] uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                      <th className="px-2 py-1.5 font-semibold">
                                        {grupo.isRecorrenteMensal ? 'Lancamento' : 'Parcela'}
                                      </th>
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
                                            {conta.numeroParcela || '-'}
                                            {!grupo.isRecorrenteMensal && grupo.totalParcelas
                                              ? `/${grupo.totalParcelas}`
                                              : ''}
                                          </td>
                                          <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">
                                            {formatDate(conta.dataVencimento)}
                                          </td>
                                          <td className="px-2 py-1.5 text-gray-700 dark:text-gray-200">
                                            {formatCurrency(conta.valorTotal)}
                                          </td>
                                          <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">
                                            {formatCurrency(conta.valorRecebido)}
                                          </td>
                                          <td className="px-2 py-1.5">
                                            <span
                                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(conta.status)}`}
                                            >
                                              {conta.status}
                                            </span>
                                          </td>
                                          <td className="px-2 py-1.5 text-right">
                                            {contaAberta ? (
                                              <button
                                                type="button"
                                                onClick={() => handleRegistrarMovimento(conta)}
                                                className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                                  isPagar
                                                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'
                                                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                                }`}
                                              >
                                                {isPagar ? 'Pagar' : 'Receber'}
                                              </button>
                                            ) : (
                                              <span className="text-[11px] text-gray-400">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
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
                const isPagar = activeTipo === 'pagar'
                const isExpanded = Boolean(expandedGrupos[grupo.id])
                const contaParaEditar = grupo.proximaContaAberta || grupo.contas[0]
                const isExpansivel = grupo.isParcelado || grupo.isRecorrenteMensal
                const vencimento =
                  grupo.primeiraData && grupo.ultimaData && grupo.primeiraData !== grupo.ultimaData
                    ? `${formatDate(grupo.primeiraData)} a ${formatDate(grupo.ultimaData)}`
                    : formatDate(grupo.primeiraData)

                return (
                  <div key={grupo.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {grupo.titulo}
                        </p>
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {grupo.cliente} -{' '}
                          {grupo.isRecorrenteMensal
                            ? 'Mensal automatica'
                            : grupo.isParcelado
                              ? `${grupo.totalParcelas}x`
                              : 'Conta unica'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClass(grupo.statusResumo)}`}
                      >
                        {grupo.statusResumo}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                      <p>Venc.: {vencimento}</p>
                      <p>
                        Parc.:{' '}
                        {grupo.isRecorrenteMensal
                          ? `${grupo.parcelasPagas}/${grupo.contas.length}`
                          : grupo.isParcelado
                            ? `${grupo.parcelasPagas}/${grupo.totalParcelas}`
                            : 'Unica'}
                      </p>
                      <p className="col-span-2">
                        Liquidado {formatCurrency(grupo.valorRecebido)} de {formatCurrency(grupo.valorTotal)}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {grupo.proximaContaAberta && (
                        <button
                          type="button"
                          onClick={() => handleRegistrarMovimento(grupo.proximaContaAberta!)}
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            isPagar
                              ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                          }`}
                        >
                          {isPagar ? (
                            <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="mr-1 h-3.5 w-3.5" />
                          )}
                          {isPagar ? 'Pagar prox.' : 'Receber prox.'}
                        </button>
                      )}
                      {contaParaEditar && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditConta(contaParaEditar)}
                          className="inline-flex items-center rounded-lg border border-indigo-300 px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </button>
                      )}
                      {isExpansivel && (
                        <button
                          type="button"
                          onClick={() => toggleGrupoExpansao(grupo.id)}
                          className="inline-flex items-center rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          {isExpanded
                            ? 'Ocultar'
                            : grupo.isRecorrenteMensal
                              ? `Ver lancamentos (${grupo.contas.length})`
                              : `Ver parcelas (${grupo.totalParcelas})`}
                          {isExpanded ? (
                            <ChevronUp className="ml-1 h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="ml-1 h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {isExpansivel && isExpanded && (
                      <div className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-slate-900/50">
                        {grupo.contas.map((conta) => {
                          const contaAberta = conta.status !== 'pago' && conta.status !== 'cancelado'

                          return (
                            <div
                              key={conta.id}
                              className="flex items-center justify-between gap-2 text-[11px] text-gray-700 dark:text-gray-300"
                            >
                              <div>
                                <p>
                                  {grupo.isRecorrenteMensal ? 'Lancamento' : 'Parcela'} {conta.numeroParcela || '-'}
                                  {!grupo.isRecorrenteMensal && grupo.totalParcelas ? `/${grupo.totalParcelas}` : ''} -{' '}
                                  {formatDate(conta.dataVencimento)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">
                                  {formatCurrency(conta.valorRecebido)} de {formatCurrency(conta.valorTotal)}
                                </p>
                              </div>
                              {contaAberta ? (
                                <button
                                  type="button"
                                  onClick={() => handleRegistrarMovimento(conta)}
                                  className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                    isPagar
                                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'
                                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                  }`}
                                >
                                  {isPagar ? 'Pagar' : 'Receber'}
                                </button>
                              ) : (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(conta.status)}`}
                                >
                                  {conta.status}
                                </span>
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
          </div>
        )}

        {!loading && meta.pages > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
            <span className="text-gray-600 dark:text-gray-300">
              Pagina {meta.page} de {meta.pages} ({meta.total} grupos)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={meta.page >= meta.pages}
                onClick={() => setPage((prev) => Math.min(meta.pages, prev + 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>

      {isDomReady &&
        showCreateModal &&
        createPortal(
        <div className="fixed left-0 top-0 z-9999 h-dvh w-dvw">
          <div
            aria-hidden="true"
            onClick={() => setShowCreateModal(false)}
            className="absolute inset-0 bg-slate-950/60"
          />

          <aside className="absolute inset-y-0 right-0 h-dvh w-full max-w-2xl overflow-hidden border-l border-purple-500/25 bg-linear-to-b from-slate-900 to-slate-950 shadow-2xl shadow-purple-900/30">
            <div className="relative shrink-0 border-b border-white/10 px-6 py-5">
              <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />
              <div className="absolute -right-10 top-2 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-600/20 p-2 text-purple-300 ring-1 ring-purple-400/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Nova Conta Financeira</h3>
                    <p className="text-xs text-slate-300">
                      Crie contas a receber/pagar com parcelas e datas especificas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateConta} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Ambiente</label>
                      <select
                        value={createForm.ambiente}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            ambiente: event.target.value as AmbienteFinanceiro,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                      >
                        <option value="geral">Fluxo total</option>
                        <option value="pessoal">Fluxo pessoal</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Tipo</label>
                      <select
                        value={createForm.tipo}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            tipo: event.target.value as 'receber' | 'pagar',
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                      >
                        <option value="receber">Conta a receber</option>
                        <option value="pagar">Conta a pagar</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Descricao</label>
                      <input
                        type="text"
                        value={createForm.descricao}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, descricao: event.target.value }))
                        }
                        placeholder="Ex: Fornecedor, aluguel, contrato"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Valor total</label>
                      <input
                        type="text"
                        value={createForm.valorTotal}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, valorTotal: event.target.value }))
                        }
                        placeholder="0,00"
                        required
                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Primeiro vencimento</label>
                      <input
                        type="date"
                        value={createForm.dataVencimento}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, dataVencimento: event.target.value }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25 dark:scheme-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={createForm.parcelado}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            parcelado: event.target.checked,
                            recorrenteMensal: event.target.checked ? false : prev.recorrenteMensal,
                          }))
                        }
                        className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-purple-500"
                      />
                      Criar como parcelado
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={createForm.recorrenteMensal}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            recorrenteMensal: event.target.checked,
                            parcelado: event.target.checked ? false : prev.parcelado,
                          }))
                        }
                        className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-purple-500"
                      />
                      Valor mensal automatico
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={createForm.autoDebito}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, autoDebito: event.target.checked }))
                        }
                        disabled={createForm.tipo !== 'pagar'}
                        className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-purple-500"
                      />
                      Debitar automaticamente no vencimento (contas a pagar)
                    </label>
                  </div>

                  {createForm.recorrenteMensal && (
                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-900/10 p-3">
                      <p className="text-xs text-cyan-200">
                        A conta sera criada como mensal automatica, sem data final. O sistema gera os proximos
                        lancamentos automaticamente.
                      </p>
                    </div>
                  )}

                  {createForm.parcelado && (
                    <div className="rounded-xl border border-purple-400/20 bg-purple-900/10 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-200">Parcelas</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-300">Quantidade de parcelas</label>
                          <input
                            type="number"
                            min={2}
                            max={120}
                            value={createForm.parcelas}
                            onChange={(event) =>
                              setCreateForm((prev) => ({ ...prev, parcelas: event.target.value }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-300">Intervalo (dias)</label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={createForm.intervaloDias}
                            onChange={(event) =>
                              setCreateForm((prev) => ({ ...prev, intervaloDias: event.target.value }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <label className="text-xs text-slate-300">
                          Datas especificas (opcional): uma por linha ou separadas por virgula
                        </label>
                        <textarea
                          rows={3}
                          value={createForm.datasParcelas}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, datasParcelas: event.target.value }))
                          }
                          placeholder={"2026-03-10\n2026-04-10\n2026-05-10"}
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/25"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar conta
                  </button>
                </div>
              </form>
          </aside>
        </div>,
        document.body
      )}

      {showEditModal && editingConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-500/25 bg-linear-to-b from-slate-900 to-slate-950 shadow-2xl shadow-indigo-900/30">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Editar Conta</h3>
                  <p className="text-xs text-slate-300">
                    Atualize os dados da conta selecionada
                    {editingConta.recorrenteMensal ? ' ou da recorrencia mensal' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingConta(null)
                  }}
                  className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditConta} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Ambiente</label>
                  <select
                    value={editForm.ambiente}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        ambiente: event.target.value as AmbienteFinanceiro,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25"
                  >
                    <option value="geral">Fluxo total</option>
                    <option value="pessoal">Fluxo pessoal</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Tipo</label>
                  <select
                    value={editForm.tipo}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        tipo: event.target.value as 'receber' | 'pagar',
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25"
                  >
                    <option value="receber">Conta a receber</option>
                    <option value="pagar">Conta a pagar</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Valor</label>
                  <input
                    type="text"
                    value={editForm.valorTotal}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, valorTotal: event.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Descricao</label>
                <input
                  type="text"
                  value={editForm.descricao}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, descricao: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">Vencimento</label>
                  <input
                    type="date"
                    value={editForm.dataVencimento}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, dataVencimento: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 outline-hidden transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25 dark:scheme-dark"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={editForm.autoDebito}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, autoDebito: event.target.checked }))
                    }
                    disabled={editForm.tipo !== 'pagar'}
                    className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-indigo-500"
                  />
                  Debito automatico
                </label>
              </div>

              {editingConta.recorrenteMensal && (
                <div className="space-y-2 rounded-xl border border-indigo-400/20 bg-indigo-900/10 p-3">
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={editForm.aplicarNoGrupoRecorrente}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          aplicarNoGrupoRecorrente: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-indigo-500"
                    />
                    Aplicar valor/descricao para todo o grupo recorrente em aberto
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={editForm.recorrenciaAtiva}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, recorrenciaAtiva: event.target.checked }))
                      }
                      className="h-4 w-4 rounded-sm border-slate-500 bg-slate-800 text-indigo-500"
                    />
                    Manter recorrencia ativa
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingConta(null)
                  }}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-800 disabled:opacity-60"
                >
                  {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar alteracoes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

