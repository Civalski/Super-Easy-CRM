'use client'

import { useEffect, useState } from 'react'
import { Save, X, Loader2 } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, SideCreateDrawer, AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityLevel, getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import type { OrcamentoFormData } from './types'
import { FIELD_CLASS, LABEL_CLASS, CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from './constants'
import { formatDateInput, parseCurrencyInput, formatCurrencyInput, currency } from './utils'
import { useOrcamentoCarrinho } from './hooks/useOrcamentoCarrinho'
import CarrinhoDrawer from './CarrinhoDrawer'

const PROBABILITY_LEVELS: ProbabilityLevel[] = ['baixa', 'media', 'alta']

interface EditOrcamentoDrawerProps {
  oportunidadeId: string
  onClose: () => void
  onSaved: () => void
}

export default function EditOrcamentoDrawer({ oportunidadeId, onClose, onSaved }: EditOrcamentoDrawerProps) {
  const cart = useOrcamentoCarrinho()
  const [formData, setFormData] = useState<OrcamentoFormData>({
    titulo: '', descricao: '', valor: '', formaPagamento: '', parcelas: '',
    desconto: '', probabilidade: 'media', dataFechamento: '', proximaAcaoEm: '',
    canalProximaAcao: '', responsavelProximaAcao: '', lembreteProximaAcao: false,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/oportunidades/${oportunidadeId}`)
        if (!res.ok) throw new Error()
        const d = await res.json()
        if (!active) return
        setFormData({
          titulo: d.titulo || '',
          descricao: d.descricao || '',
          valor: d.valor != null ? formatCurrencyInput(String(Math.round(d.valor * 100))) : '',
          formaPagamento: d.formaPagamento || '',
          parcelas: d.parcelas ? String(d.parcelas) : '',
          desconto: d.desconto != null ? formatCurrencyInput(String(Math.round(d.desconto * 100))) : '',
          probabilidade: getProbabilityLevel(d.probabilidade),
          dataFechamento: formatDateInput(d.dataFechamento),
          proximaAcaoEm: formatDateInput(d.proximaAcaoEm),
          canalProximaAcao: d.canalProximaAcao || '',
          responsavelProximaAcao: d.responsavelProximaAcao || '',
          lembreteProximaAcao: d.lembreteProximaAcao ?? false,
        })
        if (d.cliente) {
          setSelectedPerson({ id: d.clienteId ?? d.cliente.id, nome: d.cliente.nome, tipo: 'cliente' })
        }
      } catch {
        if (!active) return
        toast.error('Erro', { description: 'Não foi possível carregar o orçamento.' })
        onClose()
      } finally {
        if (active) setLoadingData(false)
      }
    })()
    return () => { active = false }
  }, [oportunidadeId, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target
    if (type === 'checkbox') {
      setFormData((p) => ({ ...p, [name]: (e.target as HTMLInputElement).checked }))
      return
    }
    setFormData((p) => {
      const next = { ...p, [name]: value }
      if (name === 'formaPagamento' && value !== 'parcelado') next.parcelas = ''
      return next
    })
  }

  const handleCurrencyChange = (field: 'valor' | 'desconto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [field]: formatCurrencyInput(e.target.value) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const valor = cart.hasCartItems ? cart.totalCarrinho : (parseCurrencyInput(formData.valor) ?? 0)
      const body = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        valor,
        formaPagamento: formData.formaPagamento || null,
        parcelas: formData.formaPagamento === 'parcelado' && formData.parcelas ? Number(formData.parcelas) : null,
        desconto: parseCurrencyInput(formData.desconto) ?? 0,
        probabilidade: getProbabilityValueFromLevel(formData.probabilidade as ProbabilityLevel),
        dataFechamento: formData.dataFechamento || null,
        proximaAcaoEm: formData.proximaAcaoEm || null,
        canalProximaAcao: formData.canalProximaAcao || null,
        responsavelProximaAcao: formData.responsavelProximaAcao || null,
        lembreteProximaAcao: formData.lembreteProximaAcao,
        clienteId: selectedPerson?.id || undefined,
        ...(cart.hasCartItems
          ? { itens: cart.itens.map(({ produtoServicoId, descricao, quantidade, precoUnitario, desconto }) => ({ produtoServicoId, descricao, quantidade, precoUnitario, desconto })) }
          : {}),
      }
      const res = await fetch(`/api/oportunidades/${oportunidadeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      onSaved()
    } catch {
      toast.error('Erro', { description: 'Não foi possível salvar o orçamento.' })
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <SideCreateDrawer open onClose={onClose}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </SideCreateDrawer>
    )
  }

  return (
    <>
      <SideCreateDrawer open onClose={onClose}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar Orçamento</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Identificação</h3>
              <div className="space-y-3">
                <label><span className={LABEL_CLASS}>Título</span>
                  <input name="titulo" value={formData.titulo} onChange={handleChange} className={FIELD_CLASS} />
                </label>
                <label><span className={LABEL_CLASS}>Cliente</span>
                  <AsyncSelect value={selectedPerson?.id || ''} initialLabel={selectedPerson?.nome || ''} onChange={setSelectedPerson} fetchUrl="/api/clientes/busca" placeholder="Buscar cliente..." />
                </label>
                <label><span className={LABEL_CLASS}>Descrição</span>
                  <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={2} className={FIELD_CLASS} />
                </label>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Produtos</h3>
              <button
                type="button"
                onClick={() => cart.setShowCarrinhoDrawer(true)}
                className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-violet-500 hover:text-violet-700 dark:border-gray-600 dark:text-gray-300 dark:hover:text-violet-300"
              >
                {cart.hasCartItems ? `${cart.itens.length} iten(s) — ${currency(cart.totalCarrinho)}` : 'Abrir carrinho de produtos'}
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Comercial</h3>
              <div className="grid grid-cols-2 gap-3">
                <label><span className={LABEL_CLASS}>Valor (R$)</span>
                  <input value={cart.hasCartItems ? currency(cart.totalCarrinho) : formData.valor} onChange={handleCurrencyChange('valor')} disabled={cart.hasCartItems} className={FIELD_CLASS} />
                </label>
                <label><span className={LABEL_CLASS}>Forma de pagamento</span>
                  <select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} className={FIELD_CLASS}>
                    {FORMA_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label><span className={LABEL_CLASS}>Desconto (R$)</span>
                  <input value={formData.desconto} onChange={handleCurrencyChange('desconto')} className={FIELD_CLASS} />
                </label>
                <label><span className={LABEL_CLASS}>Probabilidade</span>
                  <select name="probabilidade" value={formData.probabilidade} onChange={handleChange} className={FIELD_CLASS}>
                    {PROBABILITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                {formData.formaPagamento === 'parcelado' && (
                  <label><span className={LABEL_CLASS}>Parcelas</span>
                    <input type="number" name="parcelas" value={formData.parcelas} onChange={handleChange} min={1} className={FIELD_CLASS} />
                  </label>
                )}
                <label><span className={LABEL_CLASS}>Data prevista</span>
                  <input type="date" name="dataFechamento" value={formData.dataFechamento} onChange={handleChange} className={FIELD_CLASS} />
                </label>
                <label><span className={LABEL_CLASS}>Próxima ação em</span>
                  <input type="date" name="proximaAcaoEm" value={formData.proximaAcaoEm} onChange={handleChange} className={FIELD_CLASS} />
                </label>
                <label><span className={LABEL_CLASS}>Canal</span>
                  <select name="canalProximaAcao" value={formData.canalProximaAcao} onChange={handleChange} className={FIELD_CLASS}>
                    {CANAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2"><span className={LABEL_CLASS}>Responsável</span>
                  <input name="responsavelProximaAcao" value={formData.responsavelProximaAcao} onChange={handleChange} className={FIELD_CLASS} />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" name="lembreteProximaAcao" checked={formData.lembreteProximaAcao} onChange={handleChange} />
                Lembrete de próxima ação
              </label>
            </section>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !formData.titulo}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      </SideCreateDrawer>

      <CarrinhoDrawer
        open={cart.showCarrinhoDrawer}
        onClose={() => cart.setShowCarrinhoDrawer(false)}
        itens={cart.itens}
        itemForm={cart.itemForm}
        selectedProdutoLabel={cart.selectedProdutoLabel}
        cartSummary={cart.cartSummary}
        totalCarrinho={cart.totalCarrinho}
        draftSubtotal={cart.draftSubtotal}
        onItemForm={cart.handleItemForm}
        onSelectProduto={cart.handleSelectProduto}
        onAddDraftItem={cart.handleAddDraftItem}
        onRemoveDraftItem={cart.handleRemoveDraftItem}
        onDraftItemField={cart.handleDraftItemField}
        onStepQuantity={cart.handleStepQuantity}
        footer={<>
          <Button variant="outline" onClick={() => cart.setShowCarrinhoDrawer(false)}>Continuar editando</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Salvar orçamento
          </Button>
        </>}
      />
    </>
  )
}
