/**
 * Opcao para excluir a conta do usuario atual.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Loader2, NoSymbol } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, useConfirm } from '@/components/common'

export function ExcluirContaCard() {
  const router = useRouter()
  const { confirm, prompt } = useConfirm()
  const [deleting, setDeleting] = useState(false)

  const handleExcluirConta = async () => {
    const ok = await confirm({
      title: 'Excluir conta permanentemente?',
      description:
        'Essa acao remove seu usuario e todos os dados vinculados. Essa operacao nao pode ser desfeita.',
      confirmLabel: 'Sim, excluir conta',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })

    if (!ok) return

    const password = await prompt({
      title: 'Confirme sua senha para excluir a conta',
      label: 'Senha atual',
      placeholder: 'Digite sua senha',
      inputType: 'password',
      confirmLabel: 'Excluir permanentemente',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })

    if (!password?.trim()) return

    setDeleting(true)
    try {
      const response = await fetch('/api/users/me/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      let data: { error?: string; message?: string }
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error('Resposta invalida do servidor. Tente novamente mais tarde.')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta')
      }

      toast.success('Conta excluida', {
        description: data.message || 'Sua conta foi removida com sucesso.',
      })

      await signOut({ redirect: false })
      router.replace('/login')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao excluir conta', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="crm-card p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <NoSymbol className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Excluir conta</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Remove seu usuario e todos os dados vinculados permanentemente
            </p>
          </div>
        </div>
        <Button
          onClick={handleExcluirConta}
          disabled={deleting}
          variant="danger"
          size="sm"
          className="shrink-0"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <NoSymbol className="h-4 w-4" />
              Excluir conta
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
