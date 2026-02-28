'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog, SideCreateDrawer } from '@/components/common'
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import {
  ClientesHeader,
  ClientesTable,
  ClientesEmptyState,
  type Cliente,
} from '@/components/features/clientes'

type CampoPersonalizado = {
  label: string
  value: string
}

type CreateClienteForm = {
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

type PaginationMeta = {
  total: number
  page: number
  limit: number
  pages: number
}

const initialCreateForm: CreateClienteForm = {
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
}

const CLIENTES_PAGE_SIZE = 25

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: CLIENTES_PAGE_SIZE,
    pages: 1,
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<CreateClienteForm>(initialCreateForm)

  const fetchClientes = useCallback(async (targetPage: number) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/clientes?paginated=true&page=${targetPage}&limit=${CLIENTES_PAGE_SIZE}`
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Erro ao carregar clientes')
      }

      const nextData = Array.isArray(payload?.data) ? payload.data : []
      const nextMeta: PaginationMeta = {
        total: Number(payload?.meta?.total || 0),
        page: Number(payload?.meta?.page || targetPage),
        limit: Number(payload?.meta?.limit || CLIENTES_PAGE_SIZE),
        pages: Number(payload?.meta?.pages || 1),
      }

      // Se a pagina ficou vazia apos uma exclusao, volta uma pagina.
      if (nextData.length === 0 && targetPage > 1 && nextMeta.total > 0) {
        setPage((prev) => Math.max(1, prev - 1))
        return
      }

      setClientes(nextData)
      setMeta(nextMeta)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClientes([])
      setMeta((prev) => ({ ...prev, total: 0, pages: 1, page: targetPage }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes(page)

    const handleFocus = () => {
      fetchClientes(page)
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchClientes, page])

  const handleDeleteCliente = async (clienteId: string) => {
    setDeletingId(clienteId)
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
      })
      const data = response.ok ? null : await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao excluir cliente')
      }
      await fetchClientes(page)
      setClienteToDelete(null)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir cliente')
    } finally {
      setDeletingId(null)
    }
  }

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm)
  }

  const handleCreateInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddCustomField = () => {
    setCreateForm((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
    }))
  }

  const handleCustomFieldChange = (
    index: number,
    field: keyof CampoPersonalizado,
    value: string
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleRemoveCustomField = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleCreateCliente = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao criar cliente')
      }

      setShowCreateDrawer(false)
      resetCreateForm()
      await fetchClientes(1)
      setPage(1)
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Erro ao criar cliente')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ClientesHeader onCreateClick={() => setShowCreateDrawer(true)} />

      {clientes.length === 0 ? (
        <ClientesEmptyState onCreateClick={() => setShowCreateDrawer(true)} />
      ) : (
        <>
          <ClientesTable
            clientes={clientes}
            deletingId={deletingId}
            onDeleteClick={setClienteToDelete}
          />
          {meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
              <span className="text-gray-600 dark:text-gray-300">
                Pagina {meta.page} de {meta.pages} ({meta.total} clientes)
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
        </>
      )}

      <ConfirmDialog
        open={Boolean(clienteToDelete)}
        title="Excluir cliente"
        description={
          clienteToDelete
            ? `Deseja realmente excluir ${clienteToDelete.nome}? Esta acao nao pode ser desfeita.`
            : undefined
        }
        confirmLabel="Sim, excluir"
        confirmVariant="danger"
        confirmLoading={
          clienteToDelete ? deletingId === clienteToDelete.id : false
        }
        onCancel={() => {
          if (clienteToDelete && deletingId === clienteToDelete.id) {
            return
          }
          setClienteToDelete(null)
        }}
        onConfirm={() => {
          if (clienteToDelete) {
            handleDeleteCliente(clienteToDelete.id)
          }
        }}
      />

      <SideCreateDrawer
        open={showCreateDrawer}
        onClose={() => {
          setShowCreateDrawer(false)
          resetCreateForm()
        }}
        maxWidthClass="max-w-4xl"
      >
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Cliente</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Preencha os dados do novo cliente
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateDrawer(false)
                resetCreateForm()
              }}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateCliente} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={createForm.nome}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                <input
                  type="text"
                  name="telefone"
                  value={createForm.telefone}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                <input
                  type="text"
                  name="empresa"
                  value={createForm.empresa}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Endereco</label>
                <input
                  type="text"
                  name="endereco"
                  value={createForm.endereco}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Rua, numero"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={createForm.cidade}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                <input
                  type="text"
                  name="estado"
                  maxLength={2}
                  value={createForm.estado}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="SP"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">CEP</label>
                <input
                  type="text"
                  name="cep"
                  value={createForm.cep}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Mais informacoes
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                  <input
                    type="text"
                    name="cargo"
                    value={createForm.cargo}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Cargo ou funcao"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Documento</label>
                  <input
                    type="text"
                    name="documento"
                    value={createForm.documento}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="CPF ou CNPJ"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={createForm.website}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Data de nascimento</label>
                  <input
                    type="date"
                    name="dataNascimento"
                    value={createForm.dataNascimento}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Observacoes</label>
                  <textarea
                    name="observacoes"
                    value={createForm.observacoes}
                    onChange={handleCreateInputChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Informacoes adicionais sobre o cliente"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Campos personalizados
                </h3>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Plus size={14} className="mr-1" />
                  Novo campo
                </button>
              </div>

              {createForm.camposPersonalizados.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nenhum campo personalizado adicionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {createForm.camposPersonalizados.map((campo, index) => (
                    <div key={`drawer-custom-field-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="text"
                        value={campo.label}
                        onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Nome do campo"
                      />
                      <input
                        type="text"
                        value={campo.value}
                        onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowCreateDrawer(false)
                  resetCreateForm()
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-sm px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      </SideCreateDrawer>
    </div>
  )
}

