'use client'

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, AsyncSelect, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { OportunidadeHistoricoCard } from '@/components/features/oportunidades'
import {
  Minus,
  PackagePlus,
  Plus,
  X,
  Save,
  Loader2,
  Briefcase,
  History,
  FileText,
  DollarSign,
  Info,
  ClipboardList,
  ShoppingCart,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import Swal from 'sweetalert2'

interface Oportunidade {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  formaPagamento?: string | null
  parcelas?: number | null
  desconto?: number | null
  status: string
  statusAnterior?: string | null
  motivoPerda?: string | null
  probabilidade: number
  dataFechamento?: string | null
  proximaAcaoEm?: string | null
  canalProximaAcao?: string | null
  responsavelProximaAcao?: string | null
  lembreteProximaAcao?: boolean
  createdAt?: string
  updatedAt?: string
  pedido?: {
    id: string
    numero?: number
  } | null
  cliente: {
    nome: string
  }
}

interface ProdutoServico {
  id: string
  codigo?: string | null
  nome: string
  tipo: 'produto' | 'servico'
  unidade?: string | null
  precoPadrao: number
}

interface ItemForm {
  produtoServicoId: string
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
}

interface DraftCreateItem extends ItemForm {
  id: string
  subtotal: number
}

type DraftEditableField = 'descricao' | 'quantidade' | 'precoUnitario' | 'desconto'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  orcamento: { label: 'Orçamento', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: FileText },
  fechada: { label: 'Fechada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: DollarSign },
  perdida: { label: 'Perdida', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: X },
}

const formatCurrency = (value: number | null) => {
  if (!value) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const LIST_PAGE_SIZE = 20
const HISTORICO_PAGE_SIZE = 10

const buildItemForm = (): ItemForm => ({
  produtoServicoId: '',
  descricao: '',
  quantidade: 1,
  precoUnitario: 0,
  desconto: 0,
})

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeItemNumbers(quantidade: number, precoUnitario: number, desconto: number) {
  const quantidadeAjustada = Math.max(0, Number.isFinite(quantidade) ? quantidade : 0)
  const precoAjustado = Math.max(0, Number.isFinite(precoUnitario) ? precoUnitario : 0)
  const bruto = quantidadeAjustada * precoAjustado
  const descontoAjustado = Math.min(Math.max(0, Number.isFinite(desconto) ? desconto : 0), bruto)
  const subtotal = Math.max(0, bruto - descontoAjustado)

  return {
    quantidade: quantidadeAjustada,
    precoUnitario: precoAjustado,
    desconto: descontoAjustado,
    bruto,
    subtotal,
  }
}

const calculateSubtotal = (quantidade: number, precoUnitario: number, desconto: number) =>
  normalizeItemNumbers(quantidade, precoUnitario, desconto).subtotal

function summarizeCartItems(items: Array<Pick<ItemForm, 'quantidade' | 'precoUnitario' | 'desconto'>>) {
  return items.reduce(
    (acc, item) => {
      const normalized = normalizeItemNumbers(item.quantidade, item.precoUnitario, item.desconto)
      acc.quantidadeTotal += normalized.quantidade
      acc.totalBruto += normalized.bruto
      acc.totalDesconto += normalized.desconto
      acc.totalLiquido += normalized.subtotal
      return acc
    },
    { quantidadeTotal: 0, totalBruto: 0, totalDesconto: 0, totalLiquido: 0 }
  )
}

function getProdutoFromOption(option: AsyncSelectOption | null): ProdutoServico | null {
  if (!option || !option.original || typeof option.original !== 'object') {
    return null
  }

  const raw = option.original as Partial<ProdutoServico>
  if (!raw.id || !raw.nome) {
    return null
  }

  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo === 'servico' ? 'servico' : 'produto',
    codigo: raw.codigo || null,
    unidade: raw.unidade || null,
    precoPadrao: Number(raw.precoPadrao || 0),
  }
}

function OrcamentosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'abertas' | 'historico'>('abertas')
  const [orcamentosAbertos, setOrcamentosAbertos] = useState<Oportunidade[]>([])
  const [historicoVendas, setHistoricoVendas] = useState<Oportunidade[]>([])
  const [historicoPerdidas, setHistoricoPerdidas] = useState<Oportunidade[]>([])
  const [metaAbertas, setMetaAbertas] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: LIST_PAGE_SIZE,
    pages: 1,
  })
  const [metaVendas, setMetaVendas] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: HISTORICO_PAGE_SIZE,
    pages: 1,
  })
  const [metaPerdidas, setMetaPerdidas] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: HISTORICO_PAGE_SIZE,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [prefillPerson, setPrefillPerson] = useState<AsyncSelectOption | null>(null)
  const [creatingPedidoById, setCreatingPedidoById] = useState<Record<string, boolean>>({})

  const [pageAbertas, setPageAbertas] = useState(1)
  // Paginação do histórico
  const [pageVendas, setPageVendas] = useState(1)
  const [pagePerdidas, setPagePerdidas] = useState(1)

  const fetchOportunidades = useCallback(async () => {
    try {
      setLoading(true)
      if (activeTab === 'abertas') {
        const response = await fetch(
          `/api/oportunidades?status=orcamento&paginated=true&page=${pageAbertas}&limit=${LIST_PAGE_SIZE}`
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar orcamentos')

        const data = Array.isArray(payload?.data) ? payload.data : []
        const meta: PaginationMeta = {
          total: Number(payload?.meta?.total || 0),
          page: Number(payload?.meta?.page || pageAbertas),
          limit: Number(payload?.meta?.limit || LIST_PAGE_SIZE),
          pages: Number(payload?.meta?.pages || 1),
        }

        if (data.length === 0 && pageAbertas > 1 && meta.total > 0) {
          setPageAbertas((prev) => Math.max(1, prev - 1))
          return
        }

        setOrcamentosAbertos(data)
        setMetaAbertas(meta)
      } else {
        const [vendasResponse, perdidasResponse] = await Promise.all([
          fetch(
            `/api/oportunidades?status=fechada&paginated=true&page=${pageVendas}&limit=${HISTORICO_PAGE_SIZE}`
          ),
          fetch(
            `/api/oportunidades?status=perdida&paginated=true&page=${pagePerdidas}&limit=${HISTORICO_PAGE_SIZE}`
          ),
        ])

        const [vendasPayload, perdidasPayload] = await Promise.all([
          vendasResponse.json().catch(() => null),
          perdidasResponse.json().catch(() => null),
        ])

        if (!vendasResponse.ok) {
          throw new Error(vendasPayload?.error || 'Erro ao carregar vendas fechadas')
        }
        if (!perdidasResponse.ok) {
          throw new Error(perdidasPayload?.error || 'Erro ao carregar perdidas')
        }

        const vendasData = Array.isArray(vendasPayload?.data) ? vendasPayload.data : []
        const perdidasData = Array.isArray(perdidasPayload?.data) ? perdidasPayload.data : []

        const vendasMeta: PaginationMeta = {
          total: Number(vendasPayload?.meta?.total || 0),
          page: Number(vendasPayload?.meta?.page || pageVendas),
          limit: Number(vendasPayload?.meta?.limit || HISTORICO_PAGE_SIZE),
          pages: Number(vendasPayload?.meta?.pages || 1),
        }

        const perdidasMeta: PaginationMeta = {
          total: Number(perdidasPayload?.meta?.total || 0),
          page: Number(perdidasPayload?.meta?.page || pagePerdidas),
          limit: Number(perdidasPayload?.meta?.limit || HISTORICO_PAGE_SIZE),
          pages: Number(perdidasPayload?.meta?.pages || 1),
        }

        if (vendasData.length === 0 && pageVendas > 1 && vendasMeta.total > 0) {
          setPageVendas((prev) => Math.max(1, prev - 1))
          return
        }
        if (perdidasData.length === 0 && pagePerdidas > 1 && perdidasMeta.total > 0) {
          setPagePerdidas((prev) => Math.max(1, prev - 1))
          return
        }

        setHistoricoVendas(vendasData)
        setHistoricoPerdidas(perdidasData)
        setMetaVendas(vendasMeta)
        setMetaPerdidas(perdidasMeta)
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      if (activeTab === 'abertas') {
        setOrcamentosAbertos([])
        setMetaAbertas((prev) => ({ ...prev, total: 0, page: pageAbertas, pages: 1 }))
      } else {
        setHistoricoVendas([])
        setHistoricoPerdidas([])
        setMetaVendas((prev) => ({ ...prev, total: 0, page: pageVendas, pages: 1 }))
        setMetaPerdidas((prev) => ({ ...prev, total: 0, page: pagePerdidas, pages: 1 }))
      }
    } finally {
      setLoading(false)
    }
  }, [activeTab, pageAbertas, pagePerdidas, pageVendas])

  useEffect(() => {
    void fetchOportunidades()
  }, [fetchOportunidades])

  useEffect(() => {
    const shouldOpen = searchParams.get('novoOrcamento') === '1'
    const clienteId = searchParams.get('clienteId')
    if (!shouldOpen || !clienteId) return

    const clienteNome = searchParams.get('clienteNome') || 'Cliente selecionado'
    setPrefillPerson({
      id: clienteId,
      nome: clienteNome,
      tipo: 'cliente',
    })
    setShowCreateModal(true)
  }, [searchParams])

  // Estatísticas
  const stats = useMemo(() => {
    const abertas = metaAbertas.total
    const valorTotal = orcamentosAbertos.reduce((acc, o) => acc + (o.valor || 0), 0)
    const emOrcamento = metaAbertas.total
    return { abertas, valorTotal, emOrcamento }
  }, [metaAbertas.total, orcamentosAbertos])

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Confirmação ao fechar uma venda
    if (newStatus === 'fechada') {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Fechar Venda',
        text: 'Confirmar o fechamento deste orçamento como venda? O lead vinculado será convertido em cliente automaticamente, caso ainda não seja.',
        showCancelButton: true,
        confirmButtonText: 'Sim, fechar venda!',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        background: '#1f2937',
        color: '#f3f4f6',
      })
      if (!confirm.isConfirmed) return
    }

    try {
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        const data = await response.json()
        void fetchOportunidades()

        if (newStatus === 'fechada') {
          if (data.prospectoConvertidoAutomaticamente) {
            Swal.fire({
              icon: 'success',
              title: 'Venda Fechada! ðŸŽ‰',
              html: 'O orçamento foi fechado com sucesso.<br><br><strong>Lead convertido em cliente!</strong> O lead vinculado a este orçamento foi automaticamente promovido a cliente.',
              confirmButtonColor: '#16a34a',
              background: '#1f2937',
              color: '#f3f4f6',
            })
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Venda Fechada! ðŸŽ‰',
              text: 'O orçamento foi fechado com sucesso.',
              confirmButtonColor: '#16a34a',
              background: '#1f2937',
              color: '#f3f4f6',
            })
          }
        }
      } else {
        const data = await response.json()
        Swal.fire({ icon: 'error', title: 'Erro', text: data.error || 'Erro ao atualizar status', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao atualizar status. Tente novamente.', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
    }
  }

  const handleReturnToPipeline = (id: string, previousStatus: string) => {
    if (!previousStatus) return
    handleStatusChange(id, previousStatus)
  }

  const handleOrcamentoCreated = () => {
    clearOrcamentoPrefillParams()
    setPrefillPerson(null)
    setShowCreateModal(false)
    void fetchOportunidades()
  }

  const clearOrcamentoPrefillParams = useCallback(() => {
    if (!searchParams.get('novoOrcamento') && !searchParams.get('clienteId') && !searchParams.get('clienteNome')) {
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('novoOrcamento')
    params.delete('clienteId')
    params.delete('clienteNome')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `/oportunidades?${nextQuery}` : '/oportunidades')
  }, [router, searchParams])

  const handleTransformarEmPedido = async (oportunidade: Oportunidade) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Transformar em pedido',
      text: 'Este orçamento aprovado será convertido em pedido para acompanhamento de entrega e pagamento. Deseja continuar?',
      showCancelButton: true,
      confirmButtonText: 'Sim, transformar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#f3f4f6',
    })

    if (!confirm.isConfirmed) return

    try {
      setCreatingPedidoById((prev) => ({ ...prev, [oportunidade.id]: true }))
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oportunidadeId: oportunidade.id }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao transformar orçamento em pedido')
      }

      void fetchOportunidades()
      await Swal.fire({
        icon: 'success',
        title: data?.numero ? `Pedido #${data.numero} criado` : 'Pedido criado',
        text: 'O orçamento foi transformado em pedido. Acompanhe em Pedidos.',
        confirmButtonColor: '#2563eb',
        background: '#1f2937',
        color: '#f3f4f6',
      })
    } catch (error: unknown) {
      console.error('Erro ao criar pedido:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Não foi possível transformar o orçamento em pedido.',
        confirmButtonColor: '#6366f1',
        background: '#1f2937',
        color: '#f3f4f6',
      })
    } finally {
      setCreatingPedidoById((prev) => ({ ...prev, [oportunidade.id]: false }))
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Orçamentos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus orçamentos comerciais
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <Briefcase size={16} />
            <span className="text-xs font-medium">Em Aberto</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.abertas}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Valor Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.valorTotal)}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
            <FileText size={16} />
            <span className="text-xs font-medium">Orçamento</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.emOrcamento}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('abertas')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'abertas'
            ? 'border-purple-700 text-purple-700 dark:border-purple-500 dark:text-purple-500'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <Briefcase size={16} />
          Orçamentos ({metaAbertas.total})
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'historico'
            ? 'border-purple-700 text-purple-700 dark:border-purple-500 dark:text-purple-500'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <History size={16} />
          Histórico ({metaVendas.total + metaPerdidas.total})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600 dark:text-gray-400">Carregando orçamentos...</p>
          </div>
        </div>
      )}

      {/* Tab: Em Aberto */}
      {!loading && activeTab === 'abertas' && (
        <div>
          {orcamentosAbertos.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] crm-card">
              <Briefcase size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum orçamento em aberto</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Crie seu primeiro orçamento para começar
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={20} className="mr-2" />
                Novo Orçamento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orcamentosAbertos.map((oportunidade) => {
                const statusInfo = STATUS_CONFIG[oportunidade.status] || STATUS_CONFIG.orcamento
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={oportunidade.id}
                    className="crm-card p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {oportunidade.titulo}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon size={10} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {oportunidade.cliente.nome}
                        </p>
                        {oportunidade.descricao && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                            {oportunidade.descricao}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(oportunidade.valor)}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {oportunidade.probabilidade}% prob.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Criada em {formatDate(oportunidade.createdAt)}
                        {oportunidade.dataFechamento && (
                          <> ? Previsão: {formatDate(oportunidade.dataFechamento)}</>
                        )}
                        {oportunidade.proximaAcaoEm && (
                          <> ? Proxima acao: {formatDate(oportunidade.proximaAcaoEm)}</>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {oportunidade.pedido ? (
                          <a href="/pedidos">
                            <Button size="sm" variant="outline">
                              <ClipboardList size={14} className="mr-1" />
                              {oportunidade.pedido.numero
                                ? `Abrir Pedido #${oportunidade.pedido.numero}`
                                : 'Abrir Pedido'}
                            </Button>
                          </a>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransformarEmPedido(oportunidade)}
                            disabled={Boolean(creatingPedidoById[oportunidade.id])}
                          >
                            {creatingPedidoById[oportunidade.id] ? (
                              'Convertendo...'
                            ) : (
                              <>
                                <ClipboardList size={14} className="mr-1" />
                                Transformar em Pedido
                              </>
                            )}
                          </Button>
                        )}
                        <a href={`/oportunidades/${oportunidade.id}/editar`}>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {metaAbertas.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={pageAbertas <= 1}
                onClick={() => setPageAbertas((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Página {pageAbertas} de {metaAbertas.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pageAbertas >= metaAbertas.pages}
                onClick={() => setPageAbertas((prev) => Math.min(metaAbertas.pages, prev + 1))}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Histórico */}
      {!loading && activeTab === 'historico' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendas */}
          <section className="crm-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="text-green-600 dark:text-green-400" size={18} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vendas Fechadas
                </h2>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                {metaVendas.total}
              </span>
            </div>
            {historicoVendas.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {historicoVendas.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {metaVendas.pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageVendas <= 1}
                  onClick={() => setPageVendas((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Página {pageVendas} de {metaVendas.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageVendas >= metaVendas.pages}
                  onClick={() => setPageVendas((prev) => Math.min(metaVendas.pages, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            )}
          </section>

          {/* Perdidas */}
          <section className="crm-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <X className="text-red-600 dark:text-red-400" size={18} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Perdidas
                </h2>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                {metaPerdidas.total}
              </span>
            </div>
            {historicoPerdidas.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhum orçamento perdido registrado.
              </p>
            ) : (
              <div className="space-y-3">
                {historicoPerdidas.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {metaPerdidas.pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagePerdidas <= 1}
                  onClick={() => setPagePerdidas((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Página {pagePerdidas} de {metaPerdidas.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagePerdidas >= metaPerdidas.pages}
                  onClick={() => setPagePerdidas((prev) => Math.min(metaPerdidas.pages, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal de Criar Orçamento */}
      {showCreateModal && (
        <CreateOrcamentoModal
          onClose={() => {
            clearOrcamentoPrefillParams()
            setPrefillPerson(null)
            setShowCreateModal(false)
          }}
          onCreated={handleOrcamentoCreated}
          initialPerson={prefillPerson}
        />
      )}
    </div>
  )
}

export default function OrcamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
          Carregando orcamentos...
        </div>
      }
    >
      <OrcamentosPageContent />
    </Suspense>
  )
}

// ============================================
// Modal de criacao de orcamento
// ============================================
function CreateOrcamentoModal({
  onClose,
  onCreated,
  initialPerson,
}: {
  onClose: () => void
  onCreated: () => void
  initialPerson?: AsyncSelectOption | null
}) {
  const [loading, setLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(initialPerson || null)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)
  const [selectedProdutoLabel, setSelectedProdutoLabel] = useState('')
  const [itemForm, setItemForm] = useState<ItemForm>(buildItemForm())
  const [itens, setItens] = useState<DraftCreateItem[]>([])
  const [showCarrinhoDrawer, setShowCarrinhoDrawer] = useState(false)
  const [quickAddCode, setQuickAddCode] = useState('')
  const [quickAddCodeLoading, setQuickAddCodeLoading] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
    parcelas: '',
    desconto: '',
    probabilidade: '0',
    dataFechamento: new Date().toISOString().split('T')[0],
    proximaAcaoEm: '',
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: false,
  })

  const cartSummary = useMemo(() => summarizeCartItems(itens), [itens])
  const totalCarrinho = cartSummary.totalLiquido
  const draftSubtotal = calculateSubtotal(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
  const hasCartItems = itens.length > 0

  useEffect(() => {
    if (!initialPerson) return
    setSelectedPerson(initialPerson)
    setStatusInfo(initialPerson.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : null)
  }, [initialPerson])

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === 'lembreteProximaAcao') {
      const target = e.target as HTMLInputElement
      setFormData({
        ...formData,
        lembreteProximaAcao: target.checked,
      })
      return
    }

    if (e.target.name === 'formaPagamento' && e.target.value !== 'parcelado') {
      setFormData({
        ...formData,
        formaPagamento: e.target.value,
        parcelas: '',
      })
      return
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setFormData({ ...formData, valor: '' })
      return
    }
    const numericValue = parseInt(rawValue, 10) / 100
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
    setFormData({ ...formData, valor: formatted })
  }

  const handleDiscountCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setFormData({ ...formData, desconto: '' })
      return
    }
    const numericValue = parseInt(rawValue, 10) / 100
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
    setFormData({ ...formData, desconto: formatted })
  }

  const handlePersonChange = (option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    setStatusInfo(null)

    if (option && option.tipo === 'prospecto') {
      setStatusInfo('Este lead sera convertido em cliente automaticamente.')
    }
  }

  const handleItemForm = (field: keyof ItemForm, value: string) => {
    setItemForm((prev) => {
      if (field === 'descricao' || field === 'produtoServicoId') {
        return { ...prev, [field]: value }
      }
      const numericValue = toNumber(value, 0)
      const next = { ...prev, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return {
        ...next,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
      }
    })
  }

  const handleSelectProduto = (option: AsyncSelectOption | null) => {
    const selected = getProdutoFromOption(option)
    setItemForm((prev) => ({
      ...prev,
      produtoServicoId: selected?.id || '',
      descricao: selected ? selected.nome : prev.descricao,
      precoUnitario: selected ? selected.precoPadrao : prev.precoUnitario,
    }))
    setSelectedProdutoLabel(option?.nome || '')
  }

  const appendDraftItem = (draft: ItemForm) => {
    const descricao = draft.descricao.trim()
    if (!descricao || draft.quantidade <= 0) {
      return false
    }

    const normalized = normalizeItemNumbers(draft.quantidade, draft.precoUnitario, draft.desconto)
    if (normalized.quantidade <= 0) return false

    setItens((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...draft,
        descricao,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
        subtotal: normalized.subtotal,
      },
    ])

    return true
  }

  const handleAddDraftItem = () => {
    if (!appendDraftItem(itemForm)) return

    setItemForm(buildItemForm())
    setSelectedProdutoLabel('')
  }

  const handleQuickAddByCode = async () => {
    const codigo = quickAddCode.trim()
    if (!codigo) return

    setQuickAddCodeLoading(true)
    try {
      const response = await fetch(
        `/api/produtos-servicos/busca?codigo=${encodeURIComponent(codigo)}`
      )
      if (!response.ok) {
        throw new Error('Nao foi possivel buscar o produto pelo codigo')
      }

      const options = await response.json()
      const selected = Array.isArray(options) ? options[0] : null
      const produto = getProdutoFromOption(selected)

      if (!produto) {
        await Swal.fire({
          icon: 'warning',
          title: 'Codigo nao encontrado',
          text: 'Nenhum produto/servico ativo foi encontrado com esse codigo.',
          confirmButtonColor: '#6366f1',
          background: '#1f2937',
          color: '#f3f4f6',
        })
        return
      }

      appendDraftItem({
        produtoServicoId: produto.id,
        descricao: produto.nome,
        quantidade: 1,
        precoUnitario: produto.precoPadrao,
        desconto: 0,
      })
      setQuickAddCode('')
    } catch (error) {
      console.error('Erro ao buscar produto por codigo:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error instanceof Error ? error.message : 'Nao foi possivel adicionar por codigo.',
        confirmButtonColor: '#6366f1',
        background: '#1f2937',
        color: '#f3f4f6',
      })
    } finally {
      setQuickAddCodeLoading(false)
    }
  }

  const handleRemoveDraftItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id))
  }

  const handleDraftItemField = (id: string, field: DraftEditableField, value: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'descricao') {
          return { ...item, descricao: value }
        }
        const numericValue = toNumber(value, 0)
        const next = { ...item, [field]: numericValue }
        const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
        return {
          ...next,
          quantidade: normalized.quantidade,
          precoUnitario: normalized.precoUnitario,
          desconto: normalized.desconto,
          subtotal: normalized.subtotal,
        }
      })
    )
  }

  const handleStepQuantity = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextQuantidade = Math.max(0, item.quantidade + delta)
        const normalized = normalizeItemNumbers(nextQuantidade, item.precoUnitario, item.desconto)
        return {
          ...item,
          quantidade: normalized.quantidade,
          desconto: normalized.desconto,
          subtotal: normalized.subtotal,
        }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPerson) {
      Swal.fire({ icon: 'warning', title: 'Atencao', text: 'Por favor, selecione um cliente ou lead', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      return
    }

    setLoading(true)

    try {
      let finalClienteId = selectedPerson.tipo === 'cliente' ? selectedPerson.id : null
      const prospectoId = selectedPerson.tipo === 'prospecto' ? selectedPerson.id : null

      if (selectedPerson.tipo === 'prospecto') {
        const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, {
          method: 'POST',
        })
        const convData = await convRes.json()

        if (!convRes.ok) {
          if (convRes.status === 409 && convData.clienteId) {
            finalClienteId = convData.clienteId
          } else {
            throw new Error(convData.error || 'Erro ao converter lead em cliente')
          }
        } else {
          finalClienteId = convData.cliente.id
        }
      }

      if (!finalClienteId) {
        throw new Error('Nao foi possivel identificar o cliente')
      }

      const valorManual = formData.valor
        ? parseFloat(formData.valor.replace(/\./g, '').replace(',', '.'))
        : null

      const response = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          valor: hasCartItems ? totalCarrinho : valorManual,
          formaPagamento: formData.formaPagamento || null,
          parcelas:
            formData.formaPagamento === 'parcelado' && formData.parcelas
              ? parseInt(formData.parcelas, 10)
              : null,
          desconto: formData.desconto
            ? parseFloat(formData.desconto.replace(/\./g, '').replace(',', '.'))
            : null,
          probabilidade: parseInt(formData.probabilidade) || 0,
          status: 'orcamento',
          clienteId: finalClienteId,
          dataFechamento: formData.dataFechamento || null,
          proximaAcaoEm: formData.proximaAcaoEm || null,
          canalProximaAcao: formData.canalProximaAcao || null,
          responsavelProximaAcao: formData.responsavelProximaAcao || null,
          lembreteProximaAcao: formData.lembreteProximaAcao,
          prospectoId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        let carrinhoError: string | null = null

        if (itens.length > 0 && result?.id) {
          const createPedidoResponse = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oportunidadeId: result.id,
              itens: itens.map((item) => ({
                produtoServicoId: item.produtoServicoId || null,
                descricao: item.descricao,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                desconto: item.desconto,
              })),
            }),
          })

          if (!createPedidoResponse.ok) {
            const pedidoResult = await createPedidoResponse.json().catch(() => null)
            carrinhoError =
              pedidoResult?.error || 'Orcamento criado, mas nao foi possivel anexar os produtos.'
          }
        }

        let msg = 'Orcamento criado com sucesso!'
        if (result.statusAutoAtualizado) {
          msg += ' Status ajustado para Orcamento.'
        }
        if (itens.length > 0 && !carrinhoError) {
          msg += ' Carrinho de produtos anexado.'
        }

        await Swal.fire({
          icon: carrinhoError ? 'warning' : 'success',
          title: carrinhoError ? 'Orcamento criado com ressalva' : 'Orcamento Criado!',
          text: carrinhoError || msg,
          confirmButtonColor: '#6366f1',
          background: '#1f2937',
          color: '#f3f4f6',
        })
        onCreated()
      } else {
        Swal.fire({ icon: 'error', title: 'Erro', text: result.error || 'Erro ao criar orcamento', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      }
    } catch (error: unknown) {
      console.error('Erro ao criar orcamento:', error)
      Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao criar orcamento. Tente novamente.', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="h-full overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Orcamento</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              O status sera definido automaticamente
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5" />
            Fechar
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-medium">Classificacao automatica:</span> Leads em <strong>Sem contato</strong> ou <strong>Em potencial</strong> entram como <strong>Orcamento</strong>.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-4">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Identificacao
            </p>
            <div className="mt-3 space-y-4">
              <div>
                <label className={labelClass}>
              Titulo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="Ex: Orcamento de servico para empresa X"
                />
              </div>

              <div>
                <AsyncSelect
                  label="Cliente / Lead"
                  placeholder="Busque por nome, email ou empresa..."
                  value={selectedPerson ? selectedPerson.id : ''}
                  initialLabel={selectedPerson ? selectedPerson.nome : ''}
                  onChange={handlePersonChange}
                  fetchUrl="/api/pessoas/busca"
                  required
                />
                {statusInfo && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Info size={12} />
                    {statusInfo}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Descricao</label>
                <textarea
                  name="descricao"
                  rows={3}
                  value={formData.descricao}
                  onChange={handleChange}
                  className={fieldClass}
                  placeholder="Descricao detalhada do orcamento"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Produtos
            </p>
            <div className="mt-3 space-y-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Itens</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{itens.length}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Bruto</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(cartSummary.totalBruto)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/40">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(cartSummary.totalDesconto)}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 dark:border-blue-900 dark:bg-blue-950/40">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">Total</p>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totalCarrinho)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {hasCartItems ? `${itens.length} item(ns) no carrinho` : 'Nenhum produto no carrinho'}
                </p>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowCarrinhoDrawer(true)}>
                  {hasCartItems ? 'Editar carrinho' : 'Incluir produtos'}
                </Button>
              </div>

              {hasCartItems && (
                <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
                  {itens.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-2 py-1 text-xs dark:border-gray-700"
                    >
                      <span className="truncate pr-2">{item.descricao}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.quantidade}x</span>
                      <span>{currency(item.subtotal)}</span>
                    </div>
                  ))}
                  {itens.length > 3 && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      +{itens.length - 3} item(ns) no carrinho.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Comercial e acompanhamento
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>
                Valor (R$)
              </label>
              <input
                type="text"
                name="valor"
                value={formData.valor}
                onChange={handleCurrencyChange}
                disabled={hasCartItems}
                className={fieldClass}
                placeholder={hasCartItems ? 'Calculado pelo carrinho' : '0,00'}
              />
            </div>

            <div>
              <label className={labelClass}>
                Forma de Pagamento
              </label>
              <select
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartao</option>
                <option value="parcelado">Parcelado</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Desconto (R$)
              </label>
              <input
                type="text"
                name="desconto"
                value={formData.desconto}
                onChange={handleDiscountCurrencyChange}
                className={fieldClass}
                placeholder="0,00"
              />
            </div>

            <div>
              <label className={labelClass}>
                Probabilidade (%)
              </label>
              <input
                type="number"
                name="probabilidade"
                min="0"
                max="100"
                value={formData.probabilidade}
                onChange={handleChange}
                className={fieldClass}
                placeholder="0"
              />
            </div>

            <div>
              <label className={labelClass}>
                Parcelas
              </label>
              <input
                type="number"
                name="parcelas"
                min="2"
                max="24"
                value={formData.parcelas}
                onChange={handleChange}
                disabled={formData.formaPagamento !== 'parcelado'}
                className={`${fieldClass} disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800`}
                placeholder={formData.formaPagamento === 'parcelado' ? 'Ex: 3' : 'Somente parcelado'}
              />
            </div>

            <div>
              <label className={labelClass}>
                Data Prevista
              </label>
              <input
                type="date"
                name="dataFechamento"
                value={formData.dataFechamento}
                onChange={handleChange}
                className={`${fieldClass} dark:[color-scheme:dark]`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Proxima Acao
              </label>
              <input
                type="date"
                name="proximaAcaoEm"
                value={formData.proximaAcaoEm}
                onChange={handleChange}
                className={`${fieldClass} dark:[color-scheme:dark]`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Canal da Acao
              </label>
              <select
                name="canalProximaAcao"
                value={formData.canalProximaAcao}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Selecione</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="ligacao">Ligacao</option>
                <option value="reuniao">Reuniao</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Responsavel
              </label>
              <input
                type="text"
                name="responsavelProximaAcao"
                value={formData.responsavelProximaAcao}
                onChange={handleChange}
                className={fieldClass}
                placeholder="Ex: Joao"
              />
            </div>
          </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="lembreteProximaAcao"
              checked={formData.lembreteProximaAcao}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600"
            />
            Gerar lembrete para a proxima acao
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Criar Orcamento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {showCarrinhoDrawer && (
        <SideCreateDrawer
          open
          onClose={() => setShowCarrinhoDrawer(false)}
          maxWidthClass="max-w-4xl"
          zIndexClass="z-[10010]"
        >
          <div className="h-full overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Carrinho de Produtos
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Monte o carrinho do orcamento em uma tela dedicada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCarrinhoDrawer(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Fechar
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Itens</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{itens.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Bruto</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(cartSummary.totalBruto)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(cartSummary.totalDesconto)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Total</p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totalCarrinho)}</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Adicao rapida por codigo
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={quickAddCode}
                  onChange={(e) => setQuickAddCode(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleQuickAddByCode()
                    }
                  }}
                  className={fieldClass}
                  placeholder="Digite somente o codigo do produto/servico"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleQuickAddByCode}
                  disabled={quickAddCodeLoading || !quickAddCode.trim()}
                  className="sm:self-end"
                >
                  {quickAddCodeLoading ? 'Buscando...' : 'Adicionar por codigo'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Adicionar manualmente
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
                  <AsyncSelect
                    className="min-w-0"
                    placeholder="Buscar produto/servico..."
                    value={itemForm.produtoServicoId || ''}
                    initialLabel={selectedProdutoLabel}
                    onChange={handleSelectProduto}
                    fetchUrl="/api/produtos-servicos/busca"
                  />
                </label>
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao</span>
                  <input
                    value={itemForm.descricao}
                    onChange={(e) => handleItemForm('descricao', e.target.value)}
                    placeholder="Nome do item"
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemForm.quantidade}
                    onChange={(e) => handleItemForm('quantidade', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemForm.precoUnitario}
                    onChange={(e) => handleItemForm('precoUnitario', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={itemForm.desconto}
                    onChange={(e) => handleItemForm('desconto', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                  <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                    {currency(draftSubtotal)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddDraftItem}
                  disabled={!itemForm.descricao.trim() || itemForm.quantidade <= 0}
                  className="md:col-span-12"
                >
                  <PackagePlus size={14} className="mr-1.5" />
                  Adicionar ao carrinho
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <ShoppingCart size={14} />
                  Itens do carrinho
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {currency(totalCarrinho)}
                </p>
              </div>
              {itens.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nenhum item adicionado.
                </p>
              ) : (
                <div className="space-y-2">
                  {itens.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                        <label className="md:col-span-4">
                          <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Item</span>
                          <input
                            value={item.descricao}
                            onChange={(e) => handleDraftItemField(item.id, 'descricao', e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </label>
                        <div className="md:col-span-3">
                          <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Quantidade</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(item.id, -1)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.quantidade}
                              onChange={(e) => handleDraftItemField(item.id, 'quantidade', e.target.value)}
                              className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepQuantity(item.id, 1)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <label className="md:col-span-2">
                          <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Unitario</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.precoUnitario}
                            onChange={(e) => handleDraftItemField(item.id, 'precoUnitario', e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </label>
                        <label className="md:col-span-2">
                          <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.desconto}
                            onChange={(e) => handleDraftItemField(item.id, 'desconto', e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </label>
                        <div className="md:col-span-1">
                          <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                          <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                            {currency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={12} />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setShowCarrinhoDrawer(false)}>
                Concluir carrinho
              </Button>
            </div>
          </div>
        </SideCreateDrawer>
      )}
    </SideCreateDrawer>
  )
}


