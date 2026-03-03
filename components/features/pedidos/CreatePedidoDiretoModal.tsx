'use client'

import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import { AsyncSelect, Button, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import { Info, Minus, PackagePlus, Plus, ShoppingCart, X } from 'lucide-react'
import type { DraftCreateItem, DraftEditableField, ItemForm } from './types'
import { PROBABILITY_LEVELS } from './constants'
import {
  buildItemForm,
  calculateSubtotal,
  currency,
  dateBr,
  getProdutoFromOption,
  getProximaAcaoDate,
  normalizeItemNumbers,
  parseCurrencyInput,
  summarizeCartItems,
  toNumber,
} from './utils'

interface CreatePedidoDiretoModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreatePedidoDiretoModal({ onClose, onCreated }: CreatePedidoDiretoModalProps) {
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ titulo?: string; cliente?: string }>({})
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)
  const [selectedProdutoLabel, setSelectedProdutoLabel] = useState('')
  const [itemForm, setItemForm] = useState<ItemForm>(buildItemForm())
  const [itens, setItens] = useState<DraftCreateItem[]>([])
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
    parcelas: '',
    desconto: '',
    probabilidade: 'media',
    dataFechamento: new Date().toISOString().split('T')[0],
    proximaAcaoEm: getProximaAcaoDate(15, 'dias'),
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: true,
  })

  const cartSummary = useMemo(() => summarizeCartItems(itens), [itens])
  const draftSubtotal = calculateSubtotal(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
  const hasCartItems = itens.length > 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'lembreteProximaAcao') {
      const target = e.target as HTMLInputElement
      setForm((prev) => ({ ...prev, lembreteProximaAcao: target.checked }))
      return
    }
    if (e.target.name === 'formaPagamento' && e.target.value !== 'parcelado') {
      setForm((prev) => ({ ...prev, formaPagamento: e.target.value, parcelas: '' }))
      return
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (e.target.name === 'titulo' && fieldErrors.titulo && e.target.value.trim()) {
      setFieldErrors((prev) => ({ ...prev, titulo: undefined }))
    }
  }

  const handleCurrencyChange = (name: 'valor' | 'desconto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setForm((prev) => ({ ...prev, [name]: '' }))
      return
    }
    const numericValue = parseInt(rawValue, 10) / 100
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
    setForm((prev) => ({ ...prev, [name]: formatted }))
  }

  const handleItemForm = (field: keyof ItemForm, value: string) => {
    setItemForm((prev) => {
      if (field === 'descricao' || field === 'produtoServicoId') return { ...prev, [field]: value }
      const numericValue = toNumber(value, 0)
      const next = { ...prev, [field]: numericValue }
      const normalized = normalizeItemNumbers(next.quantidade, next.precoUnitario, next.desconto)
      return { ...next, quantidade: normalized.quantidade, precoUnitario: normalized.precoUnitario, desconto: normalized.desconto }
    })
  }

  const handleSelectProduto = (option: AsyncSelectOption | null) => {
    const selected = getProdutoFromOption(option)
    setItemForm((prev) => ({
      ...prev,
      produtoServicoId: selected?.id || '',
      descricao: selected ? selected.nome : prev.descricao,
      precoUnitario: selected ? selected.precoPadrao : prev.precoUnitario,
    }))
    setSelectedProdutoLabel(option?.nome || '')
  }

  const handleAddDraftItem = () => {
    if (!itemForm.descricao.trim()) return
    const normalized = normalizeItemNumbers(itemForm.quantidade, itemForm.precoUnitario, itemForm.desconto)
    if (normalized.quantidade <= 0) return
    setItens((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...itemForm,
        quantidade: normalized.quantidade,
        precoUnitario: normalized.precoUnitario,
        desconto: normalized.desconto,
        subtotal: normalized.subtotal,
      },
    ])
    setItemForm(buildItemForm())
    setSelectedProdutoLabel('')
  }

  const handleDraftItemField = (id: string, field: DraftEditableField, value: string) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (field === 'descricao') return { ...item, descricao: value }
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

  const handleRemoveDraftItem = (id: string) => setItens((prev) => prev.filter((item) => item.id !== id))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: { titulo?: string; cliente?: string } = {}
    if (!form.titulo.trim()) nextErrors.titulo = 'Titulo obrigatorio.'
    if (!selectedPerson) nextErrors.cliente = 'Cliente ou lead obrigatorio.'
    if (nextErrors.titulo || nextErrors.cliente) { setFieldErrors(nextErrors); return }

    const person = selectedPerson
    if (!person) return

    setFieldErrors({})
    setLoading(true)
    try {
      let clienteId = person.tipo === 'cliente' ? person.id : null
      if (person.tipo === 'prospecto') {
        const convRes = await fetch(`/api/prospectos/${person.id}/converter`, { method: 'POST' })
        const convData = await convRes.json().catch(() => null)
        if (!convRes.ok) {
          if (convRes.status === 409 && convData?.clienteId) clienteId = convData.clienteId
          else throw new Error(convData?.error || 'Erro ao converter lead')
        } else {
          clienteId = convData?.cliente?.id || null
        }
      }
      if (!clienteId) throw new Error('Cliente nao identificado')

      const valorManual = form.valor ? parseCurrencyInput(form.valor) : null

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          descricao: form.descricao || null,
          valor: hasCartItems ? cartSummary.totalLiquido : valorManual,
          clienteId,
          formaPagamento: form.formaPagamento || null,
          parcelas: form.formaPagamento === 'parcelado' && form.parcelas ? parseInt(form.parcelas, 10) : null,
          desconto: form.desconto ? parseCurrencyInput(form.desconto) : null,
          probabilidade: getProbabilityValueFromLevel(
            PROBABILITY_LEVELS.includes(form.probabilidade as ProbabilityLevel)
              ? (form.probabilidade as ProbabilityLevel)
              : 'media'
          ),
          dataFechamento: form.dataFechamento || null,
          proximaAcaoEm: form.proximaAcaoEm || null,
          canalProximaAcao: form.canalProximaAcao || null,
          responsavelProximaAcao: form.responsavelProximaAcao || null,
          lembreteProximaAcao: form.lembreteProximaAcao,
          statusEntrega: 'pendente',
          pagamentoConfirmado: false,
          itens: itens.map((item) => ({
            produtoServicoId: item.produtoServicoId || null,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            desconto: item.desconto,
          })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar pedido')
      await Swal.fire({ icon: 'success', title: data?.numero ? `Pedido #${data.numero} criado` : 'Pedido criado' })
      onCreated()
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Erro', text: error instanceof Error ? error.message : 'Erro ao criar pedido.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Pedido Direto</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <Info size={14} className="mt-0.5" />
            Use os mesmos dados do orcamento. O pedido nasce aprovado e segue para pagamento/entrega.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Titulo <span className="text-red-500">*</span>
            </label>
            <input
              name="titulo"
              required
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ex: Orcamento de servico para empresa X"
              className={`w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 ${
                fieldErrors.titulo ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.titulo && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.titulo}</p>}
          </div>

          <AsyncSelect
            label="Cliente / Lead"
            placeholder="Busque por nome, email ou empresa..."
            value={selectedPerson ? selectedPerson.id : ''}
            initialLabel={selectedPerson ? selectedPerson.nome : ''}
            onChange={(option) => {
              setSelectedPerson(option)
              setStatusInfo(option?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : null)
              if (option && fieldErrors.cliente) setFieldErrors((prev) => ({ ...prev, cliente: undefined }))
            }}
            fetchUrl="/api/pessoas/busca?context=oportunidade"
            required
          />
          {fieldErrors.cliente && <p className="-mt-3 text-xs text-red-600 dark:text-red-400">{fieldErrors.cliente}</p>}
          {statusInfo && <p className="text-xs text-blue-600 dark:text-blue-400">{statusInfo}</p>}

          <label>
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descricao</span>
            <textarea
              name="descricao"
              rows={3}
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descricao detalhada do pedido"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Valor (R$)</span>
              <input
                name="valor"
                value={form.valor}
                onChange={handleCurrencyChange('valor')}
                placeholder={hasCartItems ? 'Calculado pelo carrinho' : '0,00'}
                disabled={hasCartItems}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:disabled:bg-gray-700"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Forma de pagamento</span>
              <select
                name="formaPagamento"
                value={form.formaPagamento}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">Selecione</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartao</option>
                <option value="parcelado">Parcelado</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Desconto (R$)</span>
              <input
                name="desconto"
                value={form.desconto}
                onChange={handleCurrencyChange('desconto')}
                placeholder="0,00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Probabilidade</span>
              <select
                name="probabilidade"
                value={form.probabilidade}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="baixa">baixa</option>
                <option value="media">media</option>
                <option value="alta">alta</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Parcelas</span>
              <input
                type="number"
                name="parcelas"
                min="2"
                max="24"
                value={form.parcelas}
                onChange={handleChange}
                disabled={form.formaPagamento !== 'parcelado'}
                placeholder={form.formaPagamento === 'parcelado' ? 'Ex: 3' : 'Somente parcelado'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:disabled:bg-gray-700"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Data prevista</span>
              <input
                type="date"
                name="dataFechamento"
                value={form.dataFechamento}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:scheme-dark"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Proxima acao</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Em</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={proximaAcaoNumero}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1))
                    setProximaAcaoNumero(n)
                    setForm((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(n, proximaAcaoUnidade) }))
                  }}
                  className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={proximaAcaoUnidade}
                  onChange={(e) => {
                    const u = e.target.value as 'dias' | 'semanas' | 'meses'
                    setProximaAcaoUnidade(u)
                    setForm((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(proximaAcaoNumero, u) }))
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="dias">dias</option>
                  <option value="semanas">semanas</option>
                  <option value="meses">meses</option>
                </select>
                <span className="text-xs text-gray-500 dark:text-gray-400">({dateBr(form.proximaAcaoEm)})</span>
              </div>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Canal da acao</span>
              <select
                name="canalProximaAcao"
                value={form.canalProximaAcao}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">Selecione</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="ligacao">Ligacao</option>
                <option value="reuniao">Reuniao</option>
                <option value="outro">Outro</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Responsavel</span>
              <input
                type="text"
                name="responsavelProximaAcao"
                value={form.responsavelProximaAcao}
                onChange={handleChange}
                placeholder="Ex: Joao"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="lembreteProximaAcao"
              checked={form.lembreteProximaAcao}
              onChange={handleChange}
              className="h-4 w-4 rounded-sm border-gray-300 text-violet-600"
            />
            Gerar lembrete para a proxima acao
          </label>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
            <div className="space-y-3 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <ShoppingCart size={14} />
                  Carrinho
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{itens.length} item(ns)</p>
              </div>
              {itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Adicione produtos ou servicos para montar o pedido.
                </p>
              )}
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {itens.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                      <label className="md:col-span-4">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Item</span>
                        <input
                          value={item.descricao}
                          onChange={(e) => handleDraftItemField(item.id, 'descricao', e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                        />
                      </label>
                      <div className="md:col-span-3">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Quantidade</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => handleStepQuantity(item.id, -1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.quantidade}
                            onChange={(e) => handleDraftItemField(item.id, 'quantidade', e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800"
                          />
                          <button type="button" onClick={() => handleStepQuantity(item.id, 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Unitario</span>
                        <input type="number" min={0} step="0.01" value={item.precoUnitario} onChange={(e) => handleDraftItemField(item.id, 'precoUnitario', e.target.value)} className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                      </label>
                      <label className="md:col-span-2">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                        <input type="number" min={0} step="0.01" value={item.desconto} onChange={(e) => handleDraftItemField(item.id, 'desconto', e.target.value)} className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                      </label>
                      <div className="md:col-span-1">
                        <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                        <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">{currency(item.subtotal)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <button type="button" onClick={() => handleRemoveDraftItem(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">
                        <X size={12} />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-gray-300 p-2.5 dark:border-gray-700">
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <PackagePlus size={14} />
                  Adicionar item
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                  <label className="md:col-span-4">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Produto/Servico</span>
                    <AsyncSelect
                      className="min-w-0"
                      placeholder="Buscar produto/servico..."
                      value={itemForm.produtoServicoId || ''}
                      initialLabel={selectedProdutoLabel}
                      onChange={handleSelectProduto}
                      fetchUrl="/api/produtos-servicos/busca"
                    />
                  </label>
                  <label className="md:col-span-4">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Descricao</span>
                    <input value={itemForm.descricao} onChange={(e) => handleItemForm('descricao', e.target.value)} placeholder="Nome exibido no pedido" className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Qtd</span>
                    <input type="number" min={0} step="0.01" value={itemForm.quantidade} onChange={(e) => handleItemForm('quantidade', e.target.value)} className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Preco</span>
                    <input type="number" min={0} step="0.01" value={itemForm.precoUnitario} onChange={(e) => handleItemForm('precoUnitario', e.target.value)} className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                  </label>
                  <label className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Desconto</span>
                    <input type="number" min={0} step="0.01" value={itemForm.desconto} onChange={(e) => handleItemForm('desconto', e.target.value)} className="w-full min-w-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800" />
                  </label>
                  <div className="md:col-span-1">
                    <span className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">{currency(draftSubtotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDraftItem}
                    disabled={!itemForm.descricao.trim() || itemForm.quantidade <= 0}
                    className="md:col-span-12 inline-flex items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-2 text-xs font-medium text-purple-700 shadow-xs hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800"
                  >
                    <Plus size={14} />
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">Resumo</p>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Itens</span>
                <strong>{itens.length}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Quantidade total</span>
                <strong>{cartSummary.quantidadeTotal.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Subtotal bruto</span>
                <strong>{currency(cartSummary.totalBruto)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                <span>Descontos</span>
                <strong className="text-red-600 dark:text-red-400">-{currency(cartSummary.totalDesconto)}</strong>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-blue-700 dark:border-gray-700 dark:text-blue-300">
                <span>Total do pedido</span>
                <span>{currency(hasCartItems ? cartSummary.totalLiquido : parseCurrencyInput(form.valor))}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Quando ha itens no carrinho, o valor do pedido e calculado automaticamente.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Criar Pedido'}</Button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
