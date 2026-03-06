'use client'

import { useCallback, useEffect, useState } from 'react'
import { Info, Minus, Plus, Save, X } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, SideCreateDrawer, AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import { formatDate } from '@/lib/format'
import type { OrcamentoFormData } from './types'
import { FIELD_CLASS, LABEL_CLASS, CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from './constants'
import { getProximaAcaoDate, parseCurrencyInput, formatCurrencyInput, currency, summarizeCartItems } from './utils'
import { useOrcamentoCarrinho } from './hooks/useOrcamentoCarrinho'
import CarrinhoDrawer from './CarrinhoDrawer'

interface CreateOrcamentoDrawerProps {
  onClose: () => void
  onCreated: () => void
  initialPerson?: AsyncSelectOption | null
}

const PROBABILITY_LEVELS: ProbabilityLevel[] = ['baixa', 'media', 'alta']
const today = () => new Date().toISOString().split('T')[0]

export default function CreateOrcamentoDrawer({ onClose, onCreated, initialPerson }: CreateOrcamentoDrawerProps) {
  const carrinho = useOrcamentoCarrinho()
  const { hasCartItems, totalCarrinho, itens, showCarrinhoDrawer, setShowCarrinhoDrawer } = carrinho

  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(initialPerson ?? null)
  const [statusInfo, setStatusInfo] = useState('')
  const [saving, setSaving] = useState(false)
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')

  const [formData, setFormData] = useState<OrcamentoFormData>({
    titulo: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
    parcelas: '',
    desconto: '',
    probabilidade: 'media',
    dataFechamento: today(),
    proximaAcaoEm: getProximaAcaoDate(15, 'dias'),
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: true,
  })

  useEffect(() => {
    setFormData((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(proximaAcaoNumero, proximaAcaoUnidade) }))
  }, [proximaAcaoNumero, proximaAcaoUnidade])

  const handleChange = (field: keyof OrcamentoFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCurrencyChange = (raw: string) => handleChange('valor', formatCurrencyInput(raw))
  const handleDiscountCurrencyChange = (raw: string) => handleChange('desconto', formatCurrencyInput(raw))

  const handlePersonChange = useCallback((option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    if (option && option.tipo === 'prospecto') {
      setStatusInfo('Este lead sera convertido em cliente automaticamente.')
    } else {
      setStatusInfo('')
    }
  }, [])

  const handleSubmit = async () => {
    if (!selectedPerson) return
    setSaving(true)
    try {
      let clienteId = selectedPerson.id
      if (selectedPerson.tipo === 'prospecto') {
        const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, { method: 'POST' })
        if (!convRes.ok) throw new Error('Falha ao converter prospecto')
        const convData = await convRes.json()
        clienteId = convData.clienteId ?? convData.id
      }
      const valor = hasCartItems ? totalCarrinho : (parseCurrencyInput(formData.valor) ?? 0)
      const body: Record<string, unknown> = {
        clienteId, titulo: formData.titulo, descricao: formData.descricao || null, valor,
        formaPagamento: formData.formaPagamento || null,
        parcelas: formData.parcelas ? Number(formData.parcelas) : null,
        desconto: parseCurrencyInput(formData.desconto) ?? 0,
        probabilidade: getProbabilityValueFromLevel(formData.probabilidade as ProbabilityLevel),
        dataFechamento: formData.dataFechamento || null,
        proximaAcaoEm: formData.proximaAcaoEm || null,
        canalProximaAcao: formData.canalProximaAcao || null,
        responsavelProximaAcao: formData.responsavelProximaAcao || null,
        lembreteProximaAcao: formData.lembreteProximaAcao, status: 'orcamento',
      }
      if (itens.length > 0) {
        body.itens = itens.map(({ produtoServicoId, descricao, quantidade, precoUnitario, desconto: d }) => ({
          produtoServicoId, descricao, quantidade, precoUnitario, desconto: d,
        }))
      }
      const res = await fetch('/api/oportunidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Falha ao criar orçamento')
      toast.success('Orçamento criado!')
      onCreated()
    } catch (err: unknown) {
      toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao criar orçamento' })
    } finally { setSaving(false) }
  }

  return (
    <SideCreateDrawer open onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Orçamento</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className={LABEL_CLASS}>Cliente / Lead</label>
            <AsyncSelect
              fetchUrl="/api/pessoas/busca?context=oportunidade"
              value={selectedPerson?.id || ''}
              initialLabel={selectedPerson?.nome || ''}
              onChange={handlePersonChange}
              placeholder="Buscar cliente ou lead..."
            />
            {statusInfo && (
              <p className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-300">
                <Info size={12} /> {statusInfo}
              </p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Título *</label>
            <input className={FIELD_CLASS} value={formData.titulo} onChange={(e) => handleChange('titulo', e.target.value)} required />
          </div>
          <div>
            <label className={LABEL_CLASS}>Descrição</label>
            <textarea className={FIELD_CLASS} rows={2} value={formData.descricao} onChange={(e) => handleChange('descricao', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Valor (R$)</label>
              <input className={FIELD_CLASS} value={hasCartItems ? currency(totalCarrinho) : formData.valor} onChange={(e) => handleCurrencyChange(e.target.value)} disabled={hasCartItems} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Desconto (R$)</label>
              <input className={FIELD_CLASS} value={formData.desconto} onChange={(e) => handleDiscountCurrencyChange(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Forma de Pagamento</label>
              <select className={FIELD_CLASS} value={formData.formaPagamento} onChange={(e) => handleChange('formaPagamento', e.target.value)}>
                {FORMA_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Parcelas</label>
              <input type="number" min={1} className={FIELD_CLASS} value={formData.parcelas} onChange={(e) => handleChange('parcelas', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Probabilidade</label>
            <div className="flex gap-2">
              {PROBABILITY_LEVELS.map((level) => (
                <button key={level} type="button" onClick={() => handleChange('probabilidade', level)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${formData.probabilidade === level ? 'border-violet-500 bg-violet-600 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500'}`}
                >{level === 'media' ? 'média' : level}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Data de Fechamento</label>
              <input type="date" className={FIELD_CLASS} value={formData.dataFechamento} onChange={(e) => handleChange('dataFechamento', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Próxima Ação Em</label>
              <div className="flex gap-2">
                <input type="number" min={1} className={`${FIELD_CLASS} w-20`} value={proximaAcaoNumero} onChange={(e) => setProximaAcaoNumero(Math.max(1, Number(e.target.value)))} />
                <select className={FIELD_CLASS} value={proximaAcaoUnidade} onChange={(e) => setProximaAcaoUnidade(e.target.value as 'dias' | 'semanas' | 'meses')}>
                  <option value="dias">dias</option><option value="semanas">semanas</option><option value="meses">meses</option>
                </select>
              </div>
              {formData.proximaAcaoEm && <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{formatDate(formData.proximaAcaoEm)}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Canal</label>
              <select className={FIELD_CLASS} value={formData.canalProximaAcao} onChange={(e) => handleChange('canalProximaAcao', e.target.value)}>
                {CANAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Responsável</label>
              <input className={FIELD_CLASS} value={formData.responsavelProximaAcao} onChange={(e) => handleChange('responsavelProximaAcao', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={formData.lembreteProximaAcao} onChange={(e) => handleChange('lembreteProximaAcao', e.target.checked)} className="rounded border-gray-600" />
            Lembrete da próxima ação
          </label>
          {hasCartItems && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
              <p className="text-xs text-blue-700 dark:text-blue-300">Carrinho: {itens.length} {itens.length === 1 ? 'item' : 'itens'} — {currency(totalCarrinho)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <Button variant="outline" size="sm" onClick={() => setShowCarrinhoDrawer(true)}>
            Carrinho {hasCartItems && `(${itens.length})`}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !selectedPerson || !formData.titulo}>
            <Save size={14} className="mr-1.5" />
            {saving ? 'Salvando...' : 'Criar Orçamento'}
          </Button>
        </div>
      </div>

      <CarrinhoDrawer
        open={showCarrinhoDrawer}
        onClose={() => setShowCarrinhoDrawer(false)}
        itens={carrinho.itens}
        itemForm={carrinho.itemForm}
        selectedProdutoLabel={carrinho.selectedProdutoLabel}
        cartSummary={carrinho.cartSummary}
        totalCarrinho={carrinho.totalCarrinho}
        draftSubtotal={carrinho.draftSubtotal}
        onItemForm={carrinho.handleItemForm}
        onSelectProduto={carrinho.handleSelectProduto}
        onAddDraftItem={carrinho.handleAddDraftItem}
        onRemoveDraftItem={carrinho.handleRemoveDraftItem}
        onDraftItemField={carrinho.handleDraftItemField}
        onStepQuantity={carrinho.handleStepQuantity}
        footer={
          <Button size="sm" onClick={() => setShowCarrinhoDrawer(false)}>
            Concluir carrinho
          </Button>
        }
      />
    </SideCreateDrawer>
  )
}
