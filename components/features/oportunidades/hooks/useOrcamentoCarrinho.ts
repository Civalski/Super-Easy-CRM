'use client'

import { useCallback, useMemo, useState } from 'react'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { DraftCreateItem, DraftEditableField, ItemForm, ProdutoServico } from '../types'
import {
  buildItemForm,
  calculateSubtotal,
  getProdutoFromOption,
  normalizeItemNumbers,
  summarizeCartItems,
  toNumber,
} from '../utils'

export function useOrcamentoCarrinho() {
  const [itemForm, setItemForm] = useState<ItemForm>(buildItemForm())
  const [itens, setItens] = useState<DraftCreateItem[]>([])
  const [selectedProdutoLabel, setSelectedProdutoLabel] = useState('')
  const [showCarrinhoDrawer, setShowCarrinhoDrawer] = useState(false)
  const [showProdutosSection, setShowProdutosSection] = useState(false)

  const cartSummary = useMemo(() => summarizeCartItems(itens), [itens])
  const totalCarrinho = cartSummary.totalLiquido
  const draftSubtotal = calculateSubtotal(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
  const hasCartItems = itens.length > 0

  const handleItemForm = (field: keyof ItemForm, value: string) => {
    setItemForm((prev) => {
      if (field === 'produtoServicoId') return { ...prev, [field]: value }
      const numericValue = toNumber(value, 0)
      const next = { ...prev, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return { ...next, quantidade: normalized.quantidade, precoUnitario: normalized.precoUnitario, desconto: normalized.desconto }
    })
  }

  const fillItemFormFromProduto = useCallback((produto: ProdutoServico | null) => {
    setItemForm((prev) => ({
      ...prev,
      produtoServicoId: produto?.id || '',
      descricao: produto ? produto.nome : prev.descricao,
      precoUnitario: produto ? produto.precoPadrao : prev.precoUnitario,
    }))
    setSelectedProdutoLabel(produto?.nome || '')
  }, [])

  const appendDraftItem = useCallback((draft: ItemForm) => {
    const descricao = draft.descricao.trim()
    if (!draft.produtoServicoId || !descricao || draft.quantidade <= 0) return false

    const normalized = normalizeItemNumbers(draft.quantidade, draft.precoUnitario, draft.desconto)
    if (normalized.quantidade <= 0) return false

    setItens((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...draft,
        descricao,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
        subtotal: normalized.subtotal,
      },
    ])
    return true
  }, [])

  const handleSelectProduto = useCallback((option: AsyncSelectOption | null) => {
    let selected = getProdutoFromOption(option)
    if (!selected && option?.id && option?.nome) {
      selected = {
        id: String(option.id),
        nome: String(option.nome),
        tipo: 'produto',
        codigo: null,
        unidade: null,
        precoPadrao: 0,
      }
      const raw = (option.original as { precoPadrao?: number } | undefined)
      if (raw && typeof raw.precoPadrao === 'number') selected.precoPadrao = raw.precoPadrao
      else if (raw && raw.precoPadrao != null) selected.precoPadrao = Number(raw.precoPadrao)
    }
    if (!selected) {
      fillItemFormFromProduto(null)
      return
    }

    const draft: ItemForm = {
      produtoServicoId: selected.id,
      descricao: selected.nome,
      quantidade: 1,
      precoUnitario: selected.precoPadrao,
      desconto: 0,
    }

    if (appendDraftItem(draft)) {
      setItemForm(buildItemForm())
      setSelectedProdutoLabel('')
      return
    }

    fillItemFormFromProduto(selected)
  }, [appendDraftItem, fillItemFormFromProduto])

  const handleAddDraftItem = () => {
    if (!appendDraftItem(itemForm)) return
    setItemForm(buildItemForm())
    setSelectedProdutoLabel('')
  }

  const handleRemoveDraftItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id))
  }

  const handleDraftItemField = (id: string, field: DraftEditableField, value: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const numericValue = toNumber(value, 0)
        const next = { ...item, [field]: numericValue }
        const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
        return { ...next, quantidade: normalized.quantidade, precoUnitario: normalized.precoUnitario, desconto: normalized.desconto, subtotal: normalized.subtotal }
      })
    )
  }

  const handleStepQuantity = (id: string, delta: number) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextQuantidade = Math.max(0, item.quantidade + delta)
        const normalized = normalizeItemNumbers(nextQuantidade, item.precoUnitario, item.desconto)
        return { ...item, quantidade: normalized.quantidade, desconto: normalized.desconto, subtotal: normalized.subtotal }
      })
    )
  }

  return {
    itemForm,
    itens,
    selectedProdutoLabel,
    showCarrinhoDrawer,
    setShowCarrinhoDrawer,
    showProdutosSection,
    setShowProdutosSection,
    cartSummary,
    totalCarrinho,
    draftSubtotal,
    hasCartItems,
    handleItemForm,
    handleSelectProduto,
    handleAddDraftItem,
    handleRemoveDraftItem,
    handleDraftItemField,
    handleStepQuantity,
  }
}
