'use client'

import { ChangeEvent, FormEvent, Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button, ConfirmDialog } from '@/components/common'
import {
  ArrowLeft,
  BadgeDollarSign,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Edit2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Scale,
  Tag,
  Trash2,
  Users,
} from 'lucide-react'

interface Prospecto {
  id: string
  cnpj: string
  cnpjBasico: string
  cnpjOrdem: string
  cnpjDv: string
  razaoSocial: string
  nomeFantasia: string | null
  capitalSocial: string | null
  porte: string | null
  naturezaJuridica: string | null
  situacaoCadastral: string | null
  dataAbertura: string | null
  matrizFilial: string | null
  cnaePrincipal: string | null
  cnaePrincipalDesc: string | null
  cnaesSecundarios: string | null
  tipoLogradouro: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cep: string | null
  municipio: string
  uf: string
  telefone1: string | null
  telefone2: string | null
  email: string | null
  status: string
  lote: string | null
}

interface CampoPersonalizado {
  label: string
  value: string
}

interface OportunidadeHistorico {
  id: string
  titulo: string
  status: string
  valor: number | null
  motivoPerda: string | null
  createdAt: string
  updatedAt: string
  pedidoId: string | null
}

interface PedidoHistorico {
  id: string
  numero: number
  statusEntrega: string
  pagamentoConfirmado: boolean
  totalLiquido: number
  createdAt: string
  updatedAt: string
  oportunidade: {
    id: string
    titulo: string
    status: string
  }
}

interface HistoricoComercial {
  resumo: {
    orcamentosEmAberto: number
    pedidosEmAberto: number
    comprasConcluidas: number
    cancelamentos: number
  }
  oportunidadesRecentes: OportunidadeHistorico[]
  pedidosRecentes: PedidoHistorico[]
}

interface Cliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  cargo: string | null
  documento: string | null
  website: string | null
  dataNascimento: string | null
  observacoes: string | null
  camposPersonalizados: CampoPersonalizado[] | null
  createdAt: string
  updatedAt: string
  _count: {
    oportunidades: number
    contatos: number
  }
  historicoComercial?: HistoricoComercial
  prospecto?: Prospecto | null
  isVirtual?: boolean
}

interface ClienteFormData {
  nome: string
  email: string
  telefone: string
  empresa: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  cargo: string
  documento: string
  website: string
  dataNascimento: string
  observacoes: string
  camposPersonalizados: CampoPersonalizado[]
}

function ClienteDetalhesPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawId = params?.id
  const clienteId = Array.isArray(rawId) ? rawId[0] : rawId

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    cargo: '',
    documento: '',
    website: '',
    dataNascimento: '',
    observacoes: '',
    camposPersonalizados: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const syncFormWithCliente = (clienteInfo: Cliente | null) => {
    if (!clienteInfo) {
      return
    }

    setFormData({
      nome: clienteInfo.nome || '',
      email: clienteInfo.email || '',
      telefone: clienteInfo.telefone || '',
      empresa: clienteInfo.empresa || '',
      endereco: clienteInfo.endereco || '',
      cidade: clienteInfo.cidade || '',
      estado: clienteInfo.estado || '',
      cep: clienteInfo.cep || '',
      cargo: clienteInfo.cargo || '',
      documento: clienteInfo.documento || '',
      website: clienteInfo.website || '',
      dataNascimento: clienteInfo.dataNascimento || '',
      observacoes: clienteInfo.observacoes || '',
      camposPersonalizados: Array.isArray(clienteInfo.camposPersonalizados)
        ? clienteInfo.camposPersonalizados.map((campo) => ({
            label: campo.label || '',
            value: campo.value || '',
          }))
        : [],
    })
  }

  const fetchCliente = useCallback(async () => {
    if (!clienteId) {
      setError('Cliente inválido')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao carregar cliente')
      }
      setCliente(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cliente')
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    fetchCliente()
  }, [fetchCliente])

  useEffect(() => {
    syncFormWithCliente(cliente)
  }, [cliente])

  useEffect(() => {
    if (!searchParams) return
    const acao = searchParams.get('acao') || searchParams.get('editar') || searchParams.get('edit')
    if (acao === 'editar' || acao === '1') {
      setEditMode(true)
    }
  }, [searchParams])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCustomFieldChange = (
    index: number,
    field: keyof CampoPersonalizado,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleAddCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
    }))
  }

  const handleRemoveCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!clienteId) return

    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao atualizar cliente')
      }
      setCliente(data)
      setEditMode(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      setError(message)
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!clienteId) return
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
      })
      const data = response.ok ? null : await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao excluir cliente')
      }
      setDeleteDialogOpen(false)
      router.push('/clientes')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir cliente'
      setError(message)
      alert(message)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelEdit = () => {
    syncFormWithCliente(cliente)
    setEditMode(false)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatOportunidadeStatus = (status: string | null | undefined) => {
    switch (status) {
      case 'orcamento':
        return 'Orcamento'
      case 'pedido':
        return 'Pedido'
      case 'fechada':
        return 'Fechada'
      case 'perdida':
        return 'Perdida'
      case 'sem_contato':
        return 'Sem contato'
      case 'em_potencial':
        return 'Em potencial'
      default:
        return status || '-'
    }
  }

  const formatEntregaStatus = (status: string | null | undefined) => {
    switch (status) {
      case 'pendente':
        return 'Pendente'
      case 'em_preparacao':
        return 'Em preparacao'
      case 'enviado':
        return 'Enviado'
      case 'entregue':
        return 'Entregue'
      default:
        return status || '-'
    }
  }

  const getBadgeClass = (type: 'success' | 'warning' | 'danger' | 'info' | 'neutral') => {
    if (type === 'success') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
    if (type === 'warning') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
    if (type === 'danger') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
    if (type === 'info') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando cliente...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/clientes"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Clientes
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Detalhes do Cliente
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize e atualize as informações do cliente selecionado
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!editMode && !cliente?.isVirtual && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMode(true)}
                disabled={!cliente}
              >
                <Edit2 size={16} className="mr-2" />
                Editar Cliente
              </Button>
            )}
            {!cliente?.isVirtual && (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={!cliente || deleting}
              >
                {deleting ? (
                  'Excluindo...'
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Excluir Cliente
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!cliente ? (
        <div className="crm-card p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Não foi possível carregar os dados do cliente.
          </p>
          <Button type="button" onClick={fetchCliente}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="crm-card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {cliente.nome}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cliente desde {formatDate(cliente.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {cliente.email || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        Telefone
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.telefone || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Building2 size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        Empresa
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.empresa || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="crm-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Endereço
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.endereco || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Cidade
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.cidade || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Estado
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.estado ? cliente.estado.toUpperCase() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      CEP
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.cep || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="crm-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Mais informacoes
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Cargo
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.cargo || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Documento
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.documento || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Website
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white break-all">
                      {cliente.website || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Data de nascimento
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {cliente.dataNascimento ? formatDate(cliente.dataNascimento) : '-'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Observacoes
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {cliente.observacoes || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">
                    Campos personalizados
                  </p>
                  {Array.isArray(cliente.camposPersonalizados) &&
                  cliente.camposPersonalizados.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cliente.camposPersonalizados.map((campo, index) => (
                        <div
                          key={`cliente-custom-read-${index}`}
                          className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400">{campo.label}</p>
                          <p className="text-sm text-gray-900 dark:text-white">{campo.value || '-'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhum campo personalizado.
                    </p>
                  )}
                </div>
              </div>

              <div className="crm-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Historico comercial
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ultimas movimentacoes
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Orcamentos recentes
                    </p>
                    {cliente.historicoComercial?.oportunidadesRecentes?.length ? (
                      <div className="space-y-2">
                        {cliente.historicoComercial.oportunidadesRecentes.map((oportunidade) => (
                          <div key={oportunidade.id} className="rounded-md bg-gray-50 p-2 dark:bg-gray-900">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/oportunidades/${oportunidade.id}/editar`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300 line-clamp-1"
                                title={oportunidade.titulo}
                              >
                                {oportunidade.titulo}
                              </Link>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  oportunidade.status === 'fechada'
                                    ? getBadgeClass('success')
                                    : oportunidade.status === 'perdida'
                                      ? getBadgeClass('danger')
                                      : getBadgeClass('warning')
                                }`}
                              >
                                {formatOportunidadeStatus(oportunidade.status)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <span>{formatCurrency(oportunidade.valor)}</span>
                              <span>{formatDate(oportunidade.updatedAt)}</span>
                            </div>
                            {oportunidade.status === 'perdida' && oportunidade.motivoPerda && (
                              <p className="mt-1 line-clamp-1 text-xs text-red-600 dark:text-red-300">
                                Motivo: {oportunidade.motivoPerda}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum orcamento registrado.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Pedidos recentes
                    </p>
                    {cliente.historicoComercial?.pedidosRecentes?.length ? (
                      <div className="space-y-2">
                        {cliente.historicoComercial.pedidosRecentes.map((pedido) => {
                          const cancelado = pedido.oportunidade?.status === 'perdida'
                          const concluido =
                            pedido.statusEntrega === 'entregue' && pedido.pagamentoConfirmado

                          return (
                            <div key={pedido.id} className="rounded-md bg-gray-50 p-2 dark:bg-gray-900">
                            <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={{
                                    pathname: '/pedidos',
                                    query: {
                                      clienteId: cliente.id,
                                      clienteNome: cliente.nome,
                                    },
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300 line-clamp-1"
                                  title={pedido.oportunidade?.titulo || `Pedido #${pedido.numero}`}
                                >
                                  #{pedido.numero} - {pedido.oportunidade?.titulo || 'Pedido'}
                                </Link>
                                <span
                                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    cancelado
                                      ? getBadgeClass('danger')
                                      : concluido
                                        ? getBadgeClass('success')
                                        : getBadgeClass('info')
                                  }`}
                                >
                                  {cancelado
                                    ? 'Cancelado'
                                    : concluido
                                      ? 'Concluido'
                                      : formatEntregaStatus(pedido.statusEntrega)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                                <span>{formatCurrency(pedido.totalLiquido)}</span>
                                <span>{formatDate(pedido.updatedAt)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum pedido registrado.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados Empresariais (do Prospecto) */}
              {cliente.prospecto && (
                <div className="crm-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building size={18} className="text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dados Empresariais
                    </h3>
                    <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Dados da Receita Federal
                    </span>
                  </div>

                  {/* CNPJ e Identificação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <FileText size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          CNPJ
                        </p>
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {cliente.prospecto.cnpj || `${cliente.prospecto.cnpjBasico}/${cliente.prospecto.cnpjOrdem}-${cliente.prospecto.cnpjDv}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <Building2 size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          Razão Social
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {cliente.prospecto.razaoSocial}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <Tag size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          Nome Fantasia
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {cliente.prospecto.nomeFantasia || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações Financeiras e Porte */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <BadgeDollarSign size={18} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          Capital Social
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {(() => {
                            if (!cliente.prospecto.capitalSocial) return '-';
                            // O valor pode estar como string no formato brasileiro (ex: "1200,00") ou como número
                            const valorStr = String(cliente.prospecto.capitalSocial);
                            // Tenta converter removendo pontos de milhar e trocando vírgula por ponto
                            const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
                            const valor = Number(valorLimpo);
                            if (isNaN(valor)) return `R$ ${valorStr}`;
                            return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <Briefcase size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          Porte da Empresa
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {cliente.prospecto.porte || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <Scale size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                          Natureza Jurídica
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {cliente.prospecto.naturezaJuridica || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CNAE e Atividade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                        CNAE Principal
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.prospecto.cnaePrincipal && (
                          <span className="font-mono mr-2 px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                            {cliente.prospecto.cnaePrincipal}
                          </span>
                        )}
                        {cliente.prospecto.cnaePrincipalDesc || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Matriz/Filial
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.prospecto.matrizFilial || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Situação e Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Situação Cadastral
                      </p>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${cliente.prospecto.situacaoCadastral?.toLowerCase().includes('ativa')
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                          {cliente.prospecto.situacaoCadastral || '-'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Data de Abertura
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.prospecto.dataAbertura || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                        Lote de Importação
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {cliente.prospecto.lote || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="crm-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumo comercial
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={{
                      pathname: '/oportunidades',
                      query: {
                        clienteId: cliente.id,
                        clienteNome: cliente.nome,
                      },
                    }}
                    className="rounded-lg bg-amber-50 p-3 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/35"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Orcamentos abertos
                    </p>
                    <p className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-200">
                      {cliente.historicoComercial?.resumo.orcamentosEmAberto ?? 0}
                    </p>
                  </Link>
                  <Link
                    href={{
                      pathname: '/pedidos',
                      query: {
                        clienteId: cliente.id,
                        clienteNome: cliente.nome,
                        statusEntrega: 'pendente,em_preparacao,enviado',
                      },
                    }}
                    className="rounded-lg bg-blue-50 p-3 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/35"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-blue-700 dark:text-blue-300">
                      Pedidos em aberto
                    </p>
                    <p className="mt-1 text-xl font-semibold text-blue-800 dark:text-blue-200">
                      {cliente.historicoComercial?.resumo.pedidosEmAberto ?? 0}
                    </p>
                  </Link>
                  <Link
                    href={{
                      pathname: '/pedidos',
                      query: {
                        clienteId: cliente.id,
                        clienteNome: cliente.nome,
                        statusEntrega: 'entregue',
                      },
                    }}
                    className="rounded-lg bg-green-50 p-3 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/35"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-green-700 dark:text-green-300">
                      Compras concluidas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-green-800 dark:text-green-200">
                      {cliente.historicoComercial?.resumo.comprasConcluidas ?? 0}
                    </p>
                  </Link>
                  <Link
                    href={{
                      pathname: '/oportunidades',
                      query: {
                        clienteId: cliente.id,
                        clienteNome: cliente.nome,
                        aba: 'historico',
                      },
                    }}
                    className="rounded-lg bg-red-50 p-3 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/35"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-red-700 dark:text-red-300">
                      Cancelamentos
                    </p>
                    <p className="mt-1 text-xl font-semibold text-red-800 dark:text-red-200">
                      {cliente.historicoComercial?.resumo.cancelamentos ?? 0}
                    </p>
                  </Link>
                </div>
              </div>
              <div className="crm-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estatísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Orçamentos
                        </p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          {cliente._count.oportunidades}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Contatos
                        </p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          {cliente._count.contatos}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="crm-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Metadados
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs uppercase">Criado em</p>
                      <p className="text-gray-900 dark:text-white">
                        {formatDateTime(cliente.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs uppercase">Atualizado em</p>
                      <p className="text-gray-900 dark:text-white">
                        {formatDateTime(cliente.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editMode && (
            <div className="mt-8 crm-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Edit2 size={18} className="text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Editar Cliente
                </h3>
              </div>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="nome"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Nome <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      required
                      value={formData.nome}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="telefone"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="empresa"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="endereco"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Endereco
                    </label>
                    <input
                      type="text"
                      id="endereco"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, numero"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cidade"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="estado"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Estado
                    </label>
                    <input
                      type="text"
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="SP"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cep"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      CEP
                    </label>
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Mais informacoes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="cargo"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Cargo
                      </label>
                      <input
                        type="text"
                        id="cargo"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        placeholder="Cargo ou funcao"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="documento"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Documento
                      </label>
                      <input
                        type="text"
                        id="documento"
                        name="documento"
                        value={formData.documento}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        placeholder="CPF ou CNPJ"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="dataNascimento"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Data de nascimento
                      </label>
                      <input
                        type="date"
                        id="dataNascimento"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor="observacoes"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Observacoes
                      </label>
                      <textarea
                        id="observacoes"
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Informacoes adicionais sobre o cliente"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Campos personalizados
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Plus size={14} className="mr-1" />
                      Novo campo
                    </button>
                  </div>

                  {formData.camposPersonalizados.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Nenhum campo personalizado.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {formData.camposPersonalizados.map((campo, index) => (
                        <div
                          key={`detail-edit-custom-field-${index}`}
                          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <input
                            type="text"
                            value={campo.label}
                            onChange={(event) =>
                              handleCustomFieldChange(index, 'label', event.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome do campo"
                          />
                          <input
                            type="text"
                            value={campo.value}
                            onChange={(event) =>
                              handleCustomFieldChange(index, 'value', event.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            placeholder="Valor"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(index)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                            aria-label="Remover campo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
          <ConfirmDialog
            open={deleteDialogOpen}
            title="Confirmar exclusão"
            description={`Tem certeza que deseja excluir ${cliente?.nome || 'este cliente'}? Esta ação não poderá ser desfeita e removerá todos os dados relacionados.`}
            confirmLabel="Excluir cliente"
            confirmVariant="danger"
            confirmLoading={deleting}
            onCancel={() => {
              if (deleting) return
              setDeleteDialogOpen(false)
            }}
            onConfirm={handleDelete}
          />
        </>
      )}
    </div>
  )
}

export default function ClienteDetalhesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <ClienteDetalhesPageContent />
    </Suspense>
  )
}


