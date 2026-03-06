'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { EditableItemField, ItemForm, PedidoItem } from '../types'
import { buildItemForm, getProdutoFromOption, normalizeItemNumbers, toNumber } from '../utils'

interface UsePedidoItemsOptions {
  updatePedidoTotals: (
    pedidoId: string,
    totals: { totalBruto: number; totalDesconto: number; totalLiquido: number }
  ) => void
}

export function usePedidoItems({ updatePedidoTotals }: UsePedidoItemsOptions) {
  const [itemsLoaded, setItemsLoaded] = useState<Record<string, boolean>>({})
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [itemsSaving, setItemsSaving] = useState<Record<string, boolean>>({})
  const [itemsByPedido, setItemsByPedido] = useState<Record<string, PedidoItem[]>>({})
  const [itemFormByPedido, setItemFormByPedido] = useState<Record<string, ItemForm>>({})
  const [produtoLabelByPedido, setProdutoLabelByPedido] = useState<Record<string, string>>({})

  const loadItems = useCallback(async (pedidoId: string) => {
    try {
      setItemsLoading((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar itens')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: Array.isArray(data?.itens) ? data.itens : [] }))
      setItemsLoaded((prev) => ({ ...prev, [pedidoId]: true }))
      setItemFormByPedido((prev) => ({ ...prev, [pedidoId]: prev[pedidoId] || buildItemForm() }))
      if (data?.pedido) updatePedidoTotals(pedidoId, data.pedido)
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao carregar itens.' })
    } finally {
      setItemsLoading((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }, [updatePedidoTotals])

  const handleItemField = (pedidoId: string, itemId: string, field: EditableItemField, value: string) => {
    setItemsByPedido((prev) => ({
      ...prev,
      [pedidoId]: (prev[pedidoId] || []).map((item) => {
        if (item.id !== itemId) return item
        if (field === 'descricao') return { ...item, descricao: value }
        const numeric = toNumber(value, 0)
        if (field === 'quantidade') {
          const normalized = normalizeItemNumbers(numeric, item.precoUnitario, item.desconto)
          return { ...item, quantidade: normalized.quantidade, desconto: normalized.desconto, subtotal: normalized.subtotal }
        }
        if (field === 'precoUnitario') {
          const normalized = normalizeItemNumbers(item.quantidade, numeric, item.desconto)
          return { ...item, precoUnitario: normalized.precoUnitario, desconto: normalized.desconto, subtotal: normalized.subtotal }
        }
        if (field === 'desconto') {
          const normalized = normalizeItemNumbers(item.quantidade, item.precoUnitario, numeric)
          return { ...item, desconto: normalized.desconto, subtotal: normalized.subtotal }
        }
        return item
      }),
    }))
  }

  const handleSaveItem = async (pedidoId: string, item: PedidoItem) => {
    if (!item.descricao.trim()) return
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          desconto: item.desconto,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar item')
      setItemsByPedido((prev) => ({
        ...prev,
        [pedidoId]: (prev[pedidoId] || []).map((current) => (current.id === item.id ? data.item : current)),
      }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao salvar item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleDeleteItem = async (pedidoId: string, itemId: string) => {
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens?itemId=${itemId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir item')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: (prev[pedidoId] || []).filter((i) => i.id !== itemId) }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao excluir item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleItemForm = (pedidoId: string, field: keyof ItemForm, value: string) => {
    setItemFormByPedido((prev) => {
      const current = prev[pedidoId] || buildItemForm()
      if (field === 'descricao' || field === 'produtoServicoId') {
        return { ...prev, [pedidoId]: { ...current, [field]: value } }
      }
      const numericValue = toNumber(value, 0)
      const next = { ...current, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return {
        ...prev,
        [pedidoId]: { ...next, quantidade: normalized.quantidade, precoUnitario: normalized.precoUnitario, desconto: normalized.desconto },
      }
    })
  }

  const handleSelectProduto = (pedidoId: string, option: AsyncSelectOption | null) => {
    const found = getProdutoFromOption(option)
    setItemFormByPedido((prev) => {
      const current = prev[pedidoId] || buildItemForm()
      return {
        ...prev,
        [pedidoId]: {
          ...current,
          produtoServicoId: found?.id || '',
          descricao: found ? found.nome : current.descricao,
          precoUnitario: found ? found.precoPadrao : current.precoUnitario,
        },
      }
    })
    setProdutoLabelByPedido((prev) => ({ ...prev, [pedidoId]: option?.nome || '' }))
  }

  const handleAddItem = async (pedidoId: string) => {
    const form = itemFormByPedido[pedidoId] || buildItemForm()
    if (!form.descricao.trim()) return
    try {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: true }))
      const res = await fetch(`/api/pedidos/${pedidoId}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoServicoId: form.produtoServicoId || null,
          descricao: form.descricao,
          quantidade: form.quantidade,
          precoUnitario: form.precoUnitario,
          desconto: form.desconto,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao adicionar item')
      setItemsByPedido((prev) => ({ ...prev, [pedidoId]: [...(prev[pedidoId] || []), data.item] }))
      setItemFormByPedido((prev) => ({ ...prev, [pedidoId]: buildItemForm() }))
      setProdutoLabelByPedido((prev) => ({ ...prev, [pedidoId]: '' }))
      if (data?.totals) updatePedidoTotals(pedidoId, data.totals)
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao adicionar item.' })
    } finally {
      setItemsSaving((prev) => ({ ...prev, [pedidoId]: false }))
    }
  }

  return {
    itemsLoaded,
    itemsLoading,
    itemsSaving,
    itemsByPedido,
    itemFormByPedido,
    produtoLabelByPedido,
    loadItems,
    handleItemField,
    handleSaveItem,
    handleDeleteItem,
    handleItemForm,
    handleSelectProduto,
    handleAddItem,
  }
}
