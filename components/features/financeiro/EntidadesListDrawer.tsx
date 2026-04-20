'use client'

import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Building2, Edit2, Eye, Loader2, MoreVertical, Trash2, UserCheck, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { useConfirm } from '@/components/common'
import { toast } from '@/lib/toast'
import EditFornecedorDrawer from './EditFornecedorDrawer'
import EditFuncionarioDrawer from './EditFuncionarioDrawer'

interface EntidadesListDrawerProps {
  open: boolean
  onClose: () => void
  onOpenCreateConta?: (tipo: 'fornecedor' | 'funcionario', id: string, nome: string, contaTipo: 'receber' | 'pagar') => void
}

interface Fornecedor {
  id: string
  nome: string
  email: string | null
  empresa: string | null
}

interface Funcionario {
  id: string
  nome: string
  email: string | null
  cargo: string | null
}

type Tab = 'fornecedores' | 'funcionarios'

export default function EntidadesListDrawer({ open, onClose, onOpenCreateConta }: EntidadesListDrawerProps) {
  const { confirm } = useConfirm()
  const [tab, setTab] = useState<Tab>('fornecedores')
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editFornecedorId, setEditFornecedorId] = useState<string | null>(null)
  const [editFuncionarioId, setEditFuncionarioId] = useState<string | null>(null)

  const refresh = () => {
    setLoadingFornecedores(true)
    fetch('/api/financeiro/fornecedores')
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setFornecedores(data) : setFornecedores([])))
      .catch(() => setFornecedores([]))
      .finally(() => setLoadingFornecedores(false))

    setLoadingFuncionarios(true)
    fetch('/api/financeiro/funcionarios')
      .then((res) => res.json())
      .then((data) => (Array.isArray(data) ? setFuncionarios(data) : setFuncionarios([])))
      .catch(() => setFuncionarios([]))
      .finally(() => setLoadingFuncionarios(false))
  }

  useEffect(() => {
    if (!open) return
    refresh()
  }, [open])

  const loading = tab === 'fornecedores' ? loadingFornecedores : loadingFuncionarios
  const list = tab === 'fornecedores' ? fornecedores : funcionarios

  const handleEdit = (item: Fornecedor | Funcionario) => {
    setOpenMenuId(null)
    if (tab === 'fornecedores') {
      setEditFornecedorId(item.id)
    } else {
      setEditFuncionarioId(item.id)
    }
  }

  const handleDelete = async (item: Fornecedor | Funcionario) => {
    setOpenMenuId(null)
    const ok = await confirm({
      title: 'Excluir cadastro',
      description: `Deseja realmente excluir "${item.nome}"? Esta acao nao pode ser desfeita.`,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
    })
    if (!ok) return
    const url = tab === 'fornecedores' ? `/api/financeiro/fornecedores/${item.id}` : `/api/financeiro/funcionarios/${item.id}`
    try {
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir')
      toast.success(tab === 'fornecedores' ? 'Fornecedor excluido' : 'Funcionario excluido')
      refresh()
    } catch (err) {
      toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao excluir' })
    }
  }

  const handleCriarConta = (item: Fornecedor | Funcionario, contaTipo: 'receber' | 'pagar') => {
    setOpenMenuId(null)
    const tipoEntidade: 'fornecedor' | 'funcionario' = tab === 'fornecedores' ? 'fornecedor' : 'funcionario'
    onOpenCreateConta?.(tipoEntidade, item.id, item.nome, contaTipo)
    onClose()
  }

  return (
    <>
      <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-xl">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cadastros</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            <button
              type="button"
              onClick={() => setTab('fornecedores')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === 'fornecedores'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Fornecedores ({fornecedores.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('funcionarios')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === 'funcionarios'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Funcionários ({funcionarios.length})
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4" onClick={() => setOpenMenuId(null)}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhum {tab === 'fornecedores' ? 'fornecedor' : 'funcionário'} cadastrado.
              </p>
            ) : (
              <ul className="space-y-1">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{item.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {tab === 'fornecedores'
                          ? (item as Fornecedor).empresa || (item as Fornecedor).email || '-'
                          : (item as Funcionario).cargo || (item as Funcionario).email || '-'}
                      </p>
                    </div>
                    <div className="relative flex shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId((prev) => (prev === item.id ? null : item.id)) }}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400 lg:h-9 lg:w-9"
                        title="Ações"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === item.id && (
                        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 size={12} />
                            Excluir
                          </button>
                          {onOpenCreateConta && (
                            <>
                              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                              <button
                                type="button"
                                onClick={() => handleCriarConta(item, 'receber')}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                              >
                                <ArrowDownCircle size={12} />
                                Criar conta a receber
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCriarConta(item, 'pagar')}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                              >
                                <ArrowUpCircle size={12} />
                                Criar conta a pagar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SideCreateDrawer>

      <EditFornecedorDrawer
        open={!!editFornecedorId}
        onClose={() => setEditFornecedorId(null)}
        fornecedorId={editFornecedorId}
        onSaved={() => {
          toast.success('Fornecedor atualizado')
          refresh()
        }}
      />
      <EditFuncionarioDrawer
        open={!!editFuncionarioId}
        onClose={() => setEditFuncionarioId(null)}
        funcionarioId={editFuncionarioId}
        onSaved={() => {
          toast.success('Funcionario atualizado')
          refresh()
        }}
      />
    </>
  )
}
