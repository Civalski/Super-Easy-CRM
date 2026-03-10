'use client'

import { useCallback, useMemo } from 'react'
import { AsyncSelect, Button, DescontoInput, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { CheckCircle2, Loader2, Minus, PackagePlus, Plus, ShoppingCart, Trash2 } from '@/lib/icons'
import type { EditableItemField, ItemForm, Pedido, PedidoItem } from './types'
import { calculateSubtotal, currency, summarizeCartItems } from './utils'

const inputBase =
  'w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
const labelClass = 'mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400'

interface PedidoItemsDrawerProps {
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

export function PedidoItemsDrawer({
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
}: PedidoItemsDrawerProps) {
  const totals = useMemo(() => summarizeCartItems(itens), [itens])
  const draftSubtotal = calculateSubtotal(form.quantidade, form.precoUnitario, form.desconto)
  const canAddItem = form.descricao.trim().length > 0 && form.quantidade > 0
  const brutoForm = form.quantidade * form.precoUnitario

  const handleStepQuantity = useCallback(
    (item: PedidoItem, delta: number) => {
      const next = Math.max(0, item.quantidade + delta)
      onItemField(item.id, 'quantidade', String(next))
      onSaveItem({ ...item, quantidade: next })
    },
    [onItemField, onSaveItem]
  )

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-4xl" zIndexClass="z-10010">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Produtos — Pedido #{pedido.numero}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {pedido.oportunidade.titulo} — {pedido.oportunidade.cliente.nome}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Concluir
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && (
          <div className="flex-1 overflow-y-auto p-4">
            {/* Resumo */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Itens</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{itens.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Bruto</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(totals.totalBruto)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Desconto</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{currency(totals.totalDesconto)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-[10px] font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">Total</p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{currency(totals.totalLiquido)}</p>
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
                    value={form.produtoServicoId || ''}
                    initialLabel={produtoLabel}
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
                    value={form.quantidade}
                    onChange={(e) => onFormField('quantidade', e.target.value)}
                    className={inputBase}
                  />
                </label>
                <label className="w-24 min-w-0">
                  <span className={labelClass}>Preço un.</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precoUnitario || ''}
                    onChange={(e) => onFormField('precoUnitario', e.target.value)}
                    className={inputBase}
                    placeholder="0"
                  />
                </label>
                <div className="w-28 min-w-0">
                  <span className={labelClass}>Desconto</span>
                  <DescontoInput
                    bruto={brutoForm}
                    desconto={form.desconto}
                    onChange={(v) => onFormField('desconto', String(v))}
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
                  onClick={onAddItem}
                  disabled={saving || !canAddItem}
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
                  Produtos do pedido
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{currency(totals.totalLiquido)}</p>
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
                          <input
                            value={item.descricao}
                            onChange={(e) => onItemField(item.id, 'descricao', e.target.value)}
                            onBlur={(e) => {
                              const next = e.target.value.trim()
                              if (next && next !== item.descricao) onSaveItem({ ...item, descricao: next })
                            }}
                            className="w-full min-w-0 rounded border border-gray-300 bg-white px-1.5 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="Descrição"
                          />
                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            {currency(item.precoUnitario)}/un
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(item, -1)}
                            disabled={saving}
                            className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                            aria-label="Diminuir"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.quantidade}
                            onChange={(e) => onItemField(item.id, 'quantidade', e.target.value)}
                            onBlur={(e) => {
                              const next = parseFloat(String(e.target.value).replace(',', '.')) || 0
                              if (next !== item.quantidade) onSaveItem({ ...item, quantidade: Math.max(0, next) })
                            }}
                            className="w-16 rounded border border-gray-300 bg-white px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(item, 1)}
                            disabled={saving}
                            className="rounded border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
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
                            onChange={(e) => onItemField(item.id, 'precoUnitario', e.target.value)}
                            onBlur={(e) => {
                              const next = parseFloat(String(e.target.value).replace(',', '.')) || 0
                              if (next !== item.precoUnitario) onSaveItem({ ...item, precoUnitario: Math.max(0, next) })
                            }}
                            className="w-full rounded border border-gray-300 bg-white px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </label>
                        <div className="w-24 min-w-0">
                          <DescontoInput
                            bruto={brutoItem}
                            desconto={item.desconto}
                            onChange={(v) => onItemField(item.id, 'desconto', String(v))}
                            onBlur={(v) => onSaveItem({ ...item, desconto: v })}
                            disabled={saving}
                            size="sm"
                          />
                        </div>
                        <div className="w-20 shrink-0 text-right">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                            {currency(calculateSubtotal(item.quantidade, item.precoUnitario, item.desconto))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteItem(item.id)}
                          disabled={saving}
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
          </div>
        )}
      </div>
    </SideCreateDrawer>
  )
}
