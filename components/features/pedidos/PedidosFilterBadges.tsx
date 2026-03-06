import { Button } from '@/components/common'

interface PedidosFilterBadgesProps {
  clienteNomeFilter: string
  statusEntregaFilter: string
  searchFilter: string
  hasClienteFilter: boolean
  hasStatusFilter: boolean
  hasSearchFilter: boolean
  onClearFilters: () => void
}

export function PedidosFilterBadges({
  clienteNomeFilter,
  statusEntregaFilter,
  searchFilter,
  hasClienteFilter,
  hasStatusFilter,
  hasSearchFilter,
  onClearFilters,
}: PedidosFilterBadgesProps) {
  if (!hasClienteFilter && !hasStatusFilter && !hasSearchFilter) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasSearchFilter && (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-200">
          Busca: {searchFilter}
        </span>
      )}
      {hasClienteFilter && (
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          Cliente: {clienteNomeFilter}
        </span>
      )}
      {hasStatusFilter && (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Status entrega: {statusEntregaFilter}
        </span>
      )}
      <Button size="sm" variant="outline" onClick={onClearFilters}>
        Limpar filtro
      </Button>
    </div>
  )
}
