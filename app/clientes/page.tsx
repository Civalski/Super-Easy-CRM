'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/Button'
import ConfirmDialog from '@/components/ConfirmDialog'
import {
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Users,
  Eye,
  Loader2,
  Edit2,
  Trash2,
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  empresa: string | null
  _count: {
    oportunidades: number
    contatos: number
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)

  useEffect(() => {
    fetchClientes()

    // Recarrega quando a página ganha foco (útil após criar novo cliente)
    const handleFocus = () => {
      fetchClientes()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()

      // Garantir que data seja sempre um array
      if (Array.isArray(data)) {
        setClientes(data)
      } else {
        console.error('API de clientes retornou dados em formato inesperado:', data)
        setClientes([])
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

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
      setClientes((prev) => prev.filter((cliente) => cliente.id !== clienteId))
      setClienteToDelete(null)
    } catch (error: any) {
      alert(error?.message || 'Erro ao excluir cliente')
    } finally {
      setDeletingId(null)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus clientes e contatos
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus size={20} className="mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum cliente cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece adicionando seu primeiro cliente ao sistema.
          </p>
          <Link href="/clientes/novo">
            <Button>
              <Plus size={20} className="mr-2" />
              Adicionar Cliente
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estatísticas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cliente.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {cliente.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail size={14} className="mr-2" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.telefone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone size={14} className="mr-2" />
                            {cliente.telefone}
                          </div>
                        )}
                        {!cliente.email && !cliente.telefone && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cliente.empresa ? (
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Building2 size={14} className="mr-2 text-gray-400" />
                          {cliente.empresa}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm">
                          <Briefcase size={14} className="mr-1 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {cliente._count.oportunidades}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users size={14} className="mr-1 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {cliente._count.contatos}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye size={16} className="mr-1" />
                          Ver detalhes
                        </Link>
                        <Link
                          href={`/clientes/${cliente.id}?acao=editar`}
                          className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          <Edit2 size={16} className="mr-1" />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setClienteToDelete(cliente)}
                          disabled={deletingId === cliente.id}
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === cliente.id ? (
                            'Excluindo...'
                          ) : (
                            <>
                              <Trash2 size={16} className="mr-1" />
                              Excluir
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(clienteToDelete)}
        title="Excluir cliente"
        description={
          clienteToDelete
            ? `Deseja realmente excluir ${clienteToDelete.nome}? Esta ação não pode ser desfeita.`
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
    </div>
  )
}

