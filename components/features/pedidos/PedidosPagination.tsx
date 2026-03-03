import { Button } from '@/components/common'
import type { PaginationMeta } from './types'

interface PedidosPaginationProps {
  meta: PaginationMeta
  onPrevPage: () => void
  onNextPage: () => void
}

export function PedidosPagination({ meta, onPrevPage, onNextPage }: PedidosPaginationProps) {
  if (meta.pages <= 1) return null

  return (
    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
      <span className="text-gray-600 dark:text-gray-300">
        Pagina {meta.page} de {meta.pages} ({meta.total} pedidos)
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={onPrevPage}>
          Anterior
        </Button>
        <Button size="sm" variant="outline" disabled={meta.page >= meta.pages} onClick={onNextPage}>
          Proxima
        </Button>
      </div>
    </div>
  )
}
