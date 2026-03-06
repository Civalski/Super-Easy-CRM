'use client'

import { useMemo } from 'react'
import { AsyncSelect } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { Loader2, PackagePlus, Plus, ShoppingCart, Trash2, X } from '@/lib/icons'
import type { EditableItemField, ItemForm, Pedido, PedidoItem } from './types'
import { calculateSubtotal, currency, summarizeCartItems } from './utils'

interface PedidoItemsModalProps {
  pedido: Pedido
  itens: PedidoItem[]
  form: ItemForm
  produtoLabel: string
  loading: boolean
  saving: boolean
  onClose: () => void
  onItemField: (itemId: string, field: EditableItemField, value: string) => void
  onSaveItem: (item: PedidoItem) => void
  onDeleteItem: (itemId: string) => void
  onFormField: (field: keyof ItemForm, value: string) => void
  onSelectProduto: (option: AsyncSelectOption | null) => void
  onAddItem: () => void
}

export function PedidoItemsModal({
  pedido,
  itens,
  form,
  produtoLabel,
  loading,
  saving,
  onClose,
  onItemField,
  onSaveItem,
  onDeleteItem,
  onFormField,
  onSelectProduto,
  onAddItem,
}: PedidoItemsModalProps) {
  const totals = useMemo(() => summarizeCartItems(itens), [itens])
  const draftSubtotal = calculateSubtotal(form.quantidade, form.precoUnitario, form.desconto)
  const canAddItem = form.descricao.trim().length > 0 && form.quantidade > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="crm-card mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Produtos do Pedido #{pedido.numero}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pedido.oportunidade.titulo} - {pedido.oportunidade.cliente.nome}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {loading && (
          <div className="flex min-h-[120px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Itens</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{itens.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Bruto</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{currency(totals.totalBruto)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Desconto</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(totals.totalDesconto)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Total liquido</p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totals.totalLiquido)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <ShoppingCart size={14} />
                Itens no carrinho
              </div>
              {itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhum item adicionado ainda.
                </p>
              )}
              <div className="space-y-2">
                {itens.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                      <label className="md:col-span-4">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao</span>
                        <input
                          value={item.descricao}
                          onChange={(e) => onItemField(item.id, 'descricao', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Quantidade</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => onItemField(item.id, 'quantidade', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco unit.</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precoUnitario}
                          onChange={(e) => onItemField(item.id, 'precoUnitario', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.desconto}
                          onChange={(e) => onItemField(item.id, 'desconto', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <div className="flex flex-col justify-end md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                        <p className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                          {currency(calculateSubtotal(item.quantidade, item.precoUnitario, item.desconto))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSaveItem(item)}
                        className="rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 shadow-xs hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                      >
                        Salvar linha
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <PackagePlus size={14} />
                Adicionar novo item
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
                  <AsyncSelect
                    className="min-w-0"
                    placeholder="Buscar por nome, codigo, tipo..."
                    value={form.produtoServicoId || ''}
                    initialLabel={produtoLabel}
                    onChange={onSelectProduto}
                    fetchUrl="/api/produtos-servicos/busca"
                  />
                </label>
                <label className="md:col-span-4">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao do item</span>
                  <input
                    value={form.descricao}
                    onChange={(e) => onFormField('descricao', e.target.value)}
                    placeholder="Ex: Kit manutencao trimestral"
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.quantidade}
                    onChange={(e) => onFormField('quantidade', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precoUnitario}
                    onChange={(e) => onFormField('precoUnitario', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.desconto}
                    onChange={(e) => onFormField('desconto', e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                  />
                </label>
                <div className="flex flex-col justify-end md:col-span-1">
                  <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                  <p className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                    {currency(draftSubtotal)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAddItem}
                  disabled={saving || !canAddItem}
                  className="md:col-span-12 inline-flex items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-2 text-xs font-medium text-purple-700 shadow-xs hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                >
                  <Plus size={14} />
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
