'use client'

import { Minus, PackagePlus, Plus, ShoppingCart, Trash2, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { AsyncSelect } from '@/components/common'
import { Button } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { DraftCreateItem, DraftEditableField, ItemForm } from './types'
import { currency } from './utils'

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
  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-4xl" zIndexClass="z-10010">
      <div className="h-full overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Carrinho de Produtos
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Monte o carrinho do orcamento em uma tela dedicada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-3.5 w-3.5" />
            Fechar
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Itens</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{itens.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Bruto</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(cartSummary.totalBruto)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(cartSummary.totalDesconto)}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
            <p className="text-[11px] text-blue-700 dark:text-blue-300">Total</p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totalCarrinho)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Adicionar item
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
            <label className="md:col-span-7">
              <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
              <AsyncSelect
                className="min-w-0"
                placeholder="Buscar produto/servico..."
                value={itemForm.produtoServicoId || ''}
                initialLabel={selectedProdutoLabel}
                onChange={onSelectProduto}
                fetchUrl="/api/produtos-servicos/busca"
              />
            </label>
            <label className="md:col-span-2">
              <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={itemForm.quantidade}
                onChange={(e) => onItemForm('quantidade', e.target.value)}
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="md:col-span-1">
              <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={itemForm.desconto}
                onChange={(e) => onItemForm('desconto', e.target.value)}
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <div className="md:col-span-2">
              <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                {currency(draftSubtotal)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onAddDraftItem}
              disabled={!itemForm.produtoServicoId || itemForm.quantidade <= 0}
              className="md:col-span-12"
            >
              <PackagePlus size={14} className="mr-1.5" />
              Adicionar ao carrinho
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <ShoppingCart size={14} />
              Itens do carrinho
            </p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {currency(totalCarrinho)}
            </p>
          </div>
          {itens.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nenhum item adicionado.
            </p>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {item.descricao}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {currency(item.precoUnitario)} por unidade
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">Quantidade</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onStepQuantity(item.id, -1)}
                          className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => onDraftItemField(item.id, 'quantidade', e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => onStepQuantity(item.id, 1)}
                          className="rounded-md border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => onDraftItemField(item.id, 'desconto', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">Subtotal</p>
                      <p className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                        {currency(item.subtotal)}
                      </p>
                    </div>
                    <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveDraftItem(item.id)}
                        className="h-8 w-8 p-0"
                        title="Remover item"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {footer && (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </SideCreateDrawer>
  )
}
