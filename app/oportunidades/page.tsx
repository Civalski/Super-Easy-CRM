'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, AsyncSelect } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { OportunidadeHistoricoCard } from '@/components/features/oportunidades'
import {
  Plus,
  X,
  Save,
  Loader2,
  Briefcase,
  History,
  FileText,
  Handshake,
  DollarSign,
  Info,
} from 'lucide-react'
import Swal from 'sweetalert2'

interface Oportunidade {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  status: string
  statusAnterior?: string | null
  motivoPerda?: string | null
  probabilidade: number
  dataFechamento?: string | null
  createdAt?: string
  updatedAt?: string
  cliente: {
    nome: string
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  proposta: { label: 'Proposta', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: FileText },
  negociacao: { label: 'Negociação', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: Handshake },
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

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const HISTORICO_PAGE_SIZE = 10

export default function PropostasPage() {
  const [activeTab, setActiveTab] = useState<'abertas' | 'historico'>('abertas')
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Paginação do histórico
  const [pageVendas, setPageVendas] = useState(1)
  const [pagePerdidas, setPagePerdidas] = useState(1)

  const fetchOportunidades = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/oportunidades')
      const data = await response.json()
      if (Array.isArray(data)) {
        setOportunidades(data)
      } else {
        setOportunidades([])
      }
    } catch (error) {
      console.error('Erro ao carregar propostas:', error)
      setOportunidades([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOportunidades()
  }, [fetchOportunidades])

  // Propostas em aberto: somente proposta e negociação
  const propostasAbertas = useMemo(
    () => oportunidades.filter((o) => ['proposta', 'negociacao'].includes(o.status)),
    [oportunidades]
  )

  // Estatísticas
  const stats = useMemo(() => {
    const abertas = propostasAbertas.length
    const valorTotal = propostasAbertas.reduce((acc, o) => acc + (o.valor || 0), 0)
    const emNegociacao = propostasAbertas.filter((o) => o.status === 'negociacao').length
    const emProposta = propostasAbertas.filter((o) => o.status === 'proposta').length
    return { abertas, valorTotal, emNegociacao, emProposta }
  }, [propostasAbertas])

  // Histórico: fechadas e perdidas
  const getTimestamp = (opp: Oportunidade) => {
    const rawDate = opp.dataFechamento || opp.updatedAt || opp.createdAt || ''
    const date = rawDate ? new Date(rawDate) : null
    if (!date || Number.isNaN(date.getTime())) return 0
    return date.getTime()
  }

  const historicoVendas = useMemo(
    () => oportunidades.filter((o) => o.status === 'fechada').sort((a, b) => getTimestamp(b) - getTimestamp(a)),
    [oportunidades]
  )

  const historicoPerdidas = useMemo(
    () => oportunidades.filter((o) => o.status === 'perdida').sort((a, b) => getTimestamp(b) - getTimestamp(a)),
    [oportunidades]
  )

  const vendasTotalPages = Math.max(1, Math.ceil(historicoVendas.length / HISTORICO_PAGE_SIZE))
  const perdidasTotalPages = Math.max(1, Math.ceil(historicoPerdidas.length / HISTORICO_PAGE_SIZE))

  const vendasPageItems = historicoVendas.slice(
    (pageVendas - 1) * HISTORICO_PAGE_SIZE,
    pageVendas * HISTORICO_PAGE_SIZE
  )
  const perdidasPageItems = historicoPerdidas.slice(
    (pagePerdidas - 1) * HISTORICO_PAGE_SIZE,
    pagePerdidas * HISTORICO_PAGE_SIZE
  )

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Confirmação ao fechar uma venda
    if (newStatus === 'fechada') {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Fechar Venda',
        text: 'Confirmar o fechamento desta proposta como venda? O lead vinculado será convertido em cliente automaticamente, caso ainda não seja.',
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
        fetchOportunidades()

        if (newStatus === 'fechada') {
          if (data.prospectoConvertidoAutomaticamente) {
            Swal.fire({
              icon: 'success',
              title: 'Venda Fechada! 🎉',
              html: 'A proposta foi fechada com sucesso.<br><br><strong>Lead convertido em cliente!</strong> O lead vinculado a esta proposta foi automaticamente promovido a cliente.',
              confirmButtonColor: '#16a34a',
              background: '#1f2937',
              color: '#f3f4f6',
            })
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Venda Fechada! 🎉',
              text: 'A proposta foi fechada com sucesso.',
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

  const handlePropostaCreated = () => {
    setShowCreateModal(false)
    fetchOportunidades()
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
              Propostas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas propostas comerciais
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={20} className="mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <span className="text-xs font-medium">Proposta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.emProposta}</p>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
            <Handshake size={16} />
            <span className="text-xs font-medium">Negociação</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.emNegociacao}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('abertas')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'abertas'
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <Briefcase size={16} />
          Propostas ({propostasAbertas.length})
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'historico'
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          <History size={16} />
          Histórico ({historicoVendas.length + historicoPerdidas.length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600 dark:text-gray-400">Carregando propostas...</p>
          </div>
        </div>
      )}

      {/* Tab: Em Aberto */}
      {!loading && activeTab === 'abertas' && (
        <div>
          {propostasAbertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] crm-card">
              <Briefcase size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhuma proposta em aberto</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Crie sua primeira proposta para começar
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={20} className="mr-2" />
                Nova Proposta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {propostasAbertas.map((oportunidade) => {
                const statusInfo = STATUS_CONFIG[oportunidade.status] || STATUS_CONFIG.proposta
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
                          <> • Previsão: {formatDate(oportunidade.dataFechamento)}</>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(oportunidade.id, 'fechada')}
                        >
                          Fechar Venda
                        </Button>
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
                {historicoVendas.length}
              </span>
            </div>
            {historicoVendas.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {vendasPageItems.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {historicoVendas.length > HISTORICO_PAGE_SIZE && (
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
                  Página {pageVendas} de {vendasTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageVendas >= vendasTotalPages}
                  onClick={() => setPageVendas((prev) => Math.min(vendasTotalPages, prev + 1))}
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
                {historicoPerdidas.length}
              </span>
            </div>
            {historicoPerdidas.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                Nenhuma proposta perdida registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {perdidasPageItems.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {historicoPerdidas.length > HISTORICO_PAGE_SIZE && (
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
                  Página {pagePerdidas} de {perdidasTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagePerdidas >= perdidasTotalPages}
                  onClick={() => setPagePerdidas((prev) => Math.min(perdidasTotalPages, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal de Criar Proposta */}
      {showCreateModal && (
        <CreatePropostaModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePropostaCreated}
        />
      )}
    </div>
  )
}

// ============================================
// Modal de criação de proposta
// ============================================
function CreatePropostaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    probabilidade: '0',
    dataFechamento: new Date().toISOString().split('T')[0],
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

  const handlePersonChange = (option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    setStatusInfo(null)

    if (option && option.tipo === 'prospecto') {
      setStatusInfo('Este lead será convertido em cliente automaticamente.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPerson) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Por favor, selecione um cliente ou lead', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      return
    }

    setLoading(true)

    try {
      let finalClienteId = selectedPerson.tipo === 'cliente' ? selectedPerson.id : null
      const prospectoId = selectedPerson.tipo === 'prospecto' ? selectedPerson.id : null

      // Se for prospecto, converte primeiro
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
        throw new Error('Não foi possível identificar o cliente')
      }

      const response = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          valor: formData.valor ? parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) : null,
          probabilidade: parseInt(formData.probabilidade) || 0,
          status: 'proposta',
          clienteId: finalClienteId,
          dataFechamento: formData.dataFechamento || null,
          prospectoId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        let msg = 'Proposta criada com sucesso!'
        if (result.statusAutoAtualizado) {
          msg += ` Status definido como "${result.status === 'negociacao' ? 'Negociação' : 'Proposta'}".`
        }
        await Swal.fire({ icon: 'success', title: 'Proposta Criada!', text: msg, confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
        onCreated()
      } else {
        Swal.fire({ icon: 'error', title: 'Erro', text: result.error || 'Erro ao criar proposta', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      }
    } catch (error: any) {
      console.error('Erro ao criar proposta:', error)
      Swal.fire({ icon: 'error', title: 'Erro', text: error.message || 'Erro ao criar proposta. Tente novamente.', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="crm-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Proposta</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              O status será definido automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Info */}
        <div className="mx-6 mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-medium">Classificação automática:</span> Se o lead está em prospecção/qualificação → <strong>Proposta</strong>. Se já tem proposta → <strong>Negociação</strong>.
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="titulo"
              required
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Proposta de serviço para empresa X"
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
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <Info size={12} />
                {statusInfo}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descrição
            </label>
            <textarea
              name="descricao"
              rows={3}
              value={formData.descricao}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição detalhada da proposta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Valor (R$)
              </label>
              <input
                type="text"
                name="valor"
                value={formData.valor}
                onChange={handleCurrencyChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Probabilidade (%)
              </label>
              <input
                type="number"
                name="probabilidade"
                min="0"
                max="100"
                value={formData.probabilidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Data Prevista
              </label>
              <input
                type="date"
                name="dataFechamento"
                value={formData.dataFechamento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Footer */}
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
                  Criar Proposta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

