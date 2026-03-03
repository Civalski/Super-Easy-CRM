import { Button } from '@/components/common'

interface PedidosFilterBadgesProps {
  clienteNomeFilter: string
  statusEntregaFilter: string
  hasClienteFilter: boolean
  hasStatusFilter: boolean
  onClearFilters: () => void
}

export function PedidosFilterBadges({
  clienteNomeFilter,
  statusEntregaFilter,
  hasClienteFilter,
  hasStatusFilter,
  onClearFilters,
}: PedidosFilterBadgesProps) {
  if (!hasClienteFilter && !hasStatusFilter) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
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
