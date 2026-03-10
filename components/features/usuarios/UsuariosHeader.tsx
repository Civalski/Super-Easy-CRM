'use client'

import { Users } from '@/lib/icons'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'

export function UsuariosHeader() {
  const minimal = usePageHeaderMinimal()
  if (minimal) return null
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-linear-to-br from-indigo-600 to-slate-700 rounded-xl shadow-lg shadow-indigo-500/25">
        <Users className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Usuários
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Usuários cadastrados e níveis de permissão
        </p>
      </div>
    </div>
  )
}
