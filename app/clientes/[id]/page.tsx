'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
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
  createdAt: string
  updatedAt: string
  _count: {
    oportunidades: number
    contatos: number
  }
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
}

export default function ClienteDetalhesPage() {
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
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar cliente')
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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    } catch (err: any) {
      const message = err?.message || 'Erro ao atualizar cliente'
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
    } catch (err: any) {
      const message = err?.message || 'Erro ao excluir cliente'
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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

              {/* Dados Empresariais (do Prospecto) */}
              {cliente.prospecto && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                          <span className="font-mono mr-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estatísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Oportunidades
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

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endereco"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Endereço
                    </label>
                    <input
                      type="text"
                      id="endereco"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Rua, número"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                    />
                  </div>
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
