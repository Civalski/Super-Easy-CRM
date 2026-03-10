/**
 * Opção para excluir todos os dados da conta do usuário
 */
'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, useConfirm } from '@/components/common'

export function ExcluirDadosCard() {
  const { confirm } = useConfirm()
  const [clearing, setClearing] = useState(false)

  const handleExcluir = async () => {
    const ok = await confirm({
      title: 'Excluir todos os dados?',
      description: 'Remove clientes, contatos, orçamentos, tarefas, prospectos e metas da sua conta. Usuários não são apagados.',
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })

    if (!ok) return

    setClearing(true)
    try {
      const response = await fetch('/api/users/me/data', { method: 'DELETE' })
      let data: { error?: string; message?: string }
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch {
        // Servidor retornou HTML (ex: página de erro 500/404) em vez de JSON
        throw new Error('Resposta inválida do servidor. Tente novamente mais tarde.')
      }
      if (!response.ok) throw new Error(data.error || 'Erro ao excluir dados')

      toast.success('Dados excluídos', { description: data.message || 'Os dados da sua conta foram excluídos com sucesso.' })
    } catch (error) {
      toast.error('Erro ao excluir', { description: error instanceof Error ? error.message : 'Erro desconhecido' })
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
