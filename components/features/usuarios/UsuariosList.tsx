'use client'

import { Loader2, RefreshCw, ShieldAlert } from '@/lib/icons'
import { ROLE_LABELS, SUBSCRIPTION_LABELS } from './constants'
import { formatDate } from './utils'
import type { UsuarioListItem } from './types'

interface UsuariosListProps {
  users: UsuarioListItem[]
  loading: boolean
  error: string | null
  forbidden: boolean
  onRefetch: () => void
}

export function UsuariosList({
  users,
  loading,
  error,
  forbidden,
  onRefetch,
}: UsuariosListProps) {
  if (forbidden) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-6 dark:border-amber-800/50 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Acesso negado
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Apenas administradores podem visualizar esta página.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-6 dark:border-red-800/50 dark:bg-red-900/20">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={onRefetch}
          className="mt-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-8 text-center dark:border-slate-600/40 dark:bg-slate-800/30">
        <p className="text-slate-600 dark:text-slate-400">
          Nenhum usuário cadastrado.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-600/40 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                Usuário
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                Email
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                Permissão
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                Assinatura
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300">
                Cadastrado em
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-700/50"
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {u.name || u.username}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    @{u.username}
                  </div>
                </td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-slate-600 dark:text-slate-300">
                  {u.email || '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
                    }`}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                  {SUBSCRIPTION_LABELS[u.subscriptionStatus] ?? u.subscriptionStatus}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">
                  {formatDate(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2 dark:border-slate-600/40 dark:bg-slate-800/30">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {users.length} usuário{users.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={onRefetch}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>
    </div>
  )
}
