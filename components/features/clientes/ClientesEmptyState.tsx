/**
 * Estado vazio para listagem de clientes
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, Search, Users } from '@/lib/icons'

interface ClientesEmptyStateProps {
  onCreateClick?: () => void
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function ClientesEmptyState({
  onCreateClick,
  hasActiveFilters = false,
  onClearFilters,
}: ClientesEmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <div className="crm-card p-12 text-center">
        <Search size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Ajuste os filtros para visualizar mais resultados.</p>
        {onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="crm-card p-12 text-center">
      <Users size={48} className="mx-auto mb-4 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Nenhum cliente cadastrado</h3>
      <p className="mb-6 text-gray-600 dark:text-gray-400">Comece adicionando seu primeiro cliente ao sistema.</p>
      {onCreateClick ? (
        <Button onClick={onCreateClick}>
          <Plus size={20} className="mr-2" />
          Adicionar Cliente
        </Button>
      ) : (
        <Link href="/clientes/novo">
          <Button>
            <Plus size={20} className="mr-2" />
            Adicionar Cliente
          </Button>
        </Link>
      )}
    </div>
  )
}
