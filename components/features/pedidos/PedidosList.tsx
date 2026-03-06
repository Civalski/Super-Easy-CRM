import { CheckCircle2, ClipboardList, PackagePlus, Pencil, Truck, X } from '@/lib/icons'
import type { Pedido, PedidoTab } from './types'
import { SITUACAO_PEDIDO_BADGE, SITUACAO_PEDIDO_LABEL, STATUS_ENTREGA_LABEL } from './constants'
import { currency, dateBr, getPedidoSituacao } from './utils'

interface PedidosListProps {
  activeTab: PedidoTab
  pedidos: Pedido[]
  savingById: Record<string, boolean>
  onQuickApprove: (pedido: Pedido) => void
  onOpenItems: (pedidoId: string) => void
  onEdit: (pedidoId: string) => void
}

const TAB_LABELS: Record<PedidoTab, { title: string; empty: string; emptySub: string }> = {
  andamento: {
    title: 'Pedidos em andamento',
    empty: 'Nenhum pedido em andamento',
    emptySub: 'Crie um novo pedido ou ajuste os filtros',
  },
  vendas: {
    title: 'Vendas concluidas',
    empty: 'Nenhuma venda concluida',
    emptySub: 'A lista sera atualizada automaticamente quando houver pedidos neste status',
  },
  cancelados: {
    title: 'Pedidos cancelados',
    empty: 'Nenhum pedido cancelado',
    emptySub: 'A lista sera atualizada automaticamente quando houver pedidos neste status',
  },
}

const TAB_ICON: Record<PedidoTab, React.ReactNode> = {
  andamento: <Truck className="text-blue-600 dark:text-blue-400" size={18} />,
  vendas: <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />,
  cancelados: <X className="text-red-600 dark:text-red-400" size={18} />,
}

const TAB_COUNT_CLASS: Record<PedidoTab, string> = {
  andamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  vendas: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelados: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function PedidosList({ activeTab, pedidos, savingById, onQuickApprove, onOpenItems, onEdit }: PedidosListProps) {
  const labels = TAB_LABELS[activeTab]

  return (
    <section className="crm-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {TAB_ICON[activeTab]}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{labels.title}</h2>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${TAB_COUNT_CLASS[activeTab]}`}>
          {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{labels.empty}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{labels.emptySub}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="crm-table-head grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] gap-3 px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            <div className="min-w-0">Pedido</div>
            <div className="text-right">Total</div>
            <div className="text-right">Acoes</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pedidos.map((pedido, idx) => {
              const situacao = getPedidoSituacao(pedido)
              const isLast = idx === pedidos.length - 1

              return (
                <div key={pedido.id} className={!isLast ? 'border-b border-gray-100 dark:border-gray-700/60' : ''}>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-12 shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{pedido.numero}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {pedido.oportunidade.titulo}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {pedido.oportunidade.cliente.nome}
                      </p>
                    </div>

                    <div className="hidden items-center gap-1.5 sm:flex">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${SITUACAO_PEDIDO_BADGE[situacao]}`}>
                        {SITUACAO_PEDIDO_LABEL[situacao]}
                      </span>
                      <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 md:inline-flex">
                        {STATUS_ENTREGA_LABEL[pedido.statusEntrega]}
                      </span>
                      {pedido.pagamentoConfirmado && (
                        <span title="Pagamento confirmado">
                          <CheckCircle2 size={13} className="text-green-500" />
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {currency(pedido.totalLiquido)}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {pedido.dataEntrega ? dateBr(pedido.dataEntrega) : dateBr(pedido.dataAprovacao)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {situacao === 'pedido' && (
                        <button
                          type="button"
                          onClick={() => onQuickApprove(pedido)}
                          title="Aprovar pagamento/entrega"
                          disabled={Boolean(savingById[pedido.id])}
                          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenItems(pedido.id)}
                        title="Produtos do pedido"
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      >
                        <PackagePlus size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(pedido.id)}
                        title="Editar"
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
