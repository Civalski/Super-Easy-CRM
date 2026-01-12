'use client'

import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/common'
import { Loader2 } from 'lucide-react'
import {
  ClientesHeader,
  ClientesTable,
  ClientesEmptyState,
  type Cliente,
} from '@/components/features/clientes'

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
      <ClientesHeader />

      {clientes.length === 0 ? (
        <ClientesEmptyState />
      ) : (
        <ClientesTable
          clientes={clientes}
          deletingId={deletingId}
          onDeleteClick={setClienteToDelete}
        />
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


