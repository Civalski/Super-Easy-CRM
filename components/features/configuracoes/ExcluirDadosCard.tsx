/**
 * Opção para excluir todos os dados da conta do usuário
 */
'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '@/components/common'

export function ExcluirDadosCard() {
  const [clearing, setClearing] = useState(false)

  const handleExcluir = async () => {
    const isDark = document.documentElement.classList.contains('dark')
    const confirmacao = await Swal.fire({
      title: 'Excluir todos os dados?',
      text: 'Remove clientes, contatos, orçamentos, tarefas, prospectos e metas da sua conta. Usuários não são apagados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#111827',
    })

    if (!confirmacao.isConfirmed) return

    setClearing(true)
    try {
      const response = await fetch('/api/users/me/data', { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao excluir dados')

      await Swal.fire({
        title: 'Dados excluídos',
        text: data.message || 'Os dados da sua conta foram excluídos com sucesso.',
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
      })
    } catch (error) {
      await Swal.fire({
        title: 'Erro ao excluir',
        text: error instanceof Error ? error.message : 'Erro desconhecido',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#111827',
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Trash2 className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Excluir dados da conta</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Remove clientes, tarefas, prospectos e demais dados da sua conta</p>
          </div>
        </div>
        <Button
          onClick={handleExcluir}
          disabled={clearing}
          variant="danger"
          size="sm"
          className="shrink-0"
        >
          {clearing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Excluir
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
