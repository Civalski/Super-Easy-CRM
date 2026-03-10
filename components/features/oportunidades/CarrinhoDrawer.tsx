'use client'

import { Minus, PackagePlus, Plus, ShoppingCart, Trash2, X } from '@/lib/icons'
import { AsyncSelect, Button, DescontoInput, SideCreateDrawer } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { DraftCreateItem, DraftEditableField, ItemForm } from './types'
import { currency } from './utils'

const inputBase =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
const labelClass = 'mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400'

interface CarrinhoDrawerProps {
  open: boolean
  onClose: () => void
  itens: DraftCreateItem[]
  itemForm: ItemForm
  selectedProdutoLabel: string
  cartSummary: { totalBruto: number; totalDesconto: number; totalLiquido: number }
  totalCarrinho: number
  draftSubtotal: number
  onItemForm: (field: keyof ItemForm, value: string) => void
  onSelectProduto: (option: AsyncSelectOption | null) => void
  onAddDraftItem: () => void
  onRemoveDraftItem: (id: string) => void
  onDraftItemField: (id: string, field: DraftEditableField, value: string) => void
  onStepQuantity: (id: string, delta: number) => void
  footer?: React.ReactNode
}

export default function CarrinhoDrawer({
  open,
  onClose,
  itens,
  itemForm,
  selectedProdutoLabel,
  cartSummary,
  totalCarrinho,
  draftSubtotal,
  onItemForm,
  onSelectProduto,
  onAddDraftItem,
  onRemoveDraftItem,
  onDraftItemField,
  onStepQuantity,
  footer,
}: CarrinhoDrawerProps) {
  const brutoForm = itemForm.quantidade * itemForm.precoUnitario

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-4xl" zIndexClass="z-10010">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Carrinho de Produtos</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-3.5 w-3.5" />
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Resumo */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Itens</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{itens.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Bruto</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(cartSummary.totalBruto)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Desconto</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(cartSummary.totalDesconto)}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">Total</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totalCarrinho)}</p>
            </div>
          </div>

          {/* Adicionar item */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/20">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Adicionar item
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-end">
              <label className="min-w-0">
                <span className={labelClass}>Produto/Serviço</span>
                <AsyncSelect
                  className="min-w-0"
                  placeholder="Buscar..."
                  value={itemForm.produtoServicoId || ''}
                  initialLabel={selectedProdutoLabel}
                  onChange={onSelectProduto}
                  fetchUrl="/api/produtos-servicos/busca"
                />
              </label>
              <label className="w-20 min-w-0">
                <span className={labelClass}>Qtd</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={itemForm.quantidade}
                  onChange={(e) => onItemForm('quantidade', e.target.value)}
                  className={inputBase}
                />
              </label>
              <label className="w-24 min-w-0">
                <span className={labelClass}>Preço un.</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={itemForm.precoUnitario || ''}
                  onChange={(e) => onItemForm('precoUnitario', e.target.value)}
                  className={inputBase}
                  placeholder="0"
                />
              </label>
              <div className="w-28 min-w-0">
                <span className={labelClass}>Desconto</span>
                <DescontoInput
                  bruto={brutoForm}
                  desconto={itemForm.desconto}
                  onChange={(v) => onItemForm('desconto', String(v))}
                  size="md"
                />
              </div>
              <div className="w-24 min-w-0">
                <span className={labelClass}>Subtotal</span>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                  {currency(draftSubtotal)}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={onAddDraftItem}
                disabled={!itemForm.produtoServicoId || itemForm.quantidade <= 0}
              >
                <PackagePlus size={14} className="mr-1.5" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/20">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <ShoppingCart size={14} />
                Itens do carrinho
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{currency(totalCarrinho)}</p>
            </div>
            {itens.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">Nenhum item adicionado.</p>
            ) : (
              <div className="space-y-1.5">
                {itens.map((item) => {
                  const brutoItem = item.quantidade * item.precoUnitario
                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800/50"
                    >
                      <div className="min-w-0 flex-1 basis-32">
                        <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{item.descricao}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {currency(item.precoUnitario)}/un
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onStepQuantity(item.id, -1)}
                          className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          aria-label="Diminuir"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => onDraftItemField(item.id, 'quantidade', e.target.value)}
                          className="w-16 rounded border border-gray-300 bg-white px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => onStepQuantity(item.id, 1)}
                          className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          aria-label="Aumentar"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <label className="w-20 min-w-0">
                        <span className="sr-only">Preço un.</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoUnitario || ''}
                          onChange={(e) => onDraftItemField(item.id, 'precoUnitario', e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </label>
                      <div className="w-24 min-w-0">
                        <DescontoInput
                          bruto={brutoItem}
                          desconto={item.desconto}
                          onChange={(v) => onDraftItemField(item.id, 'desconto', String(v))}
                          size="sm"
                        />
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{currency(item.subtotal)}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveDraftItem(item.id)}
                        className="h-7 w-7 shrink-0 p-0"
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {footer && (
            <div className="mt-4 flex justify-end border-t border-gray-200 pt-3 dark:border-gray-700">{footer}</div>
          )}
        </div>
      </div>
    </SideCreateDrawer>
  )
}
