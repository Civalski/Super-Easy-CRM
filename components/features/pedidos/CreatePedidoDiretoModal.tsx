'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Info, Save, X } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { AsyncSelect, Button, SideCreateDrawer } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import { getTodayLocalISO } from '@/lib/date'
import { formatDate } from '@/lib/format'
import { useOrcamentoCarrinho } from '@/components/features/oportunidades/hooks/useOrcamentoCarrinho'
import CarrinhoDrawer from '@/components/features/oportunidades/CarrinhoDrawer'
import { FIELD_CLASS, LABEL_CLASS, CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from '@/components/features/oportunidades/constants'
import { getProximaAcaoDate, parseCurrencyInput, formatCurrencyInput, currency } from '@/components/features/oportunidades/utils'
import { PROBABILITY_LEVELS } from './constants'

const PROBABILITY_LABELS: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const today = () => getTodayLocalISO()

interface CreatePedidoDiretoModalProps {
  initialPerson?: AsyncSelectOption | null
  onClose: () => void
  onCreated: () => void
}

export function CreatePedidoDiretoModal({ initialPerson = null, onClose, onCreated }: CreatePedidoDiretoModalProps) {
  const carrinho = useOrcamentoCarrinho()
  const { hasCartItems, totalCarrinho, itens, showCarrinhoDrawer, setShowCarrinhoDrawer } = carrinho

  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(initialPerson)
  const [statusInfo, setStatusInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ cliente?: string }>({})
  const [probOpen, setProbOpen] = useState(false)
  const probRef = useRef<HTMLDivElement>(null)
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
    parcelas: '',
    desconto: '',
    probabilidade: 'media' as ProbabilityLevel,
    dataFechamento: today(),
    proximaAcaoEm: getProximaAcaoDate(15, 'dias'),
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: true,
  })

  useEffect(() => {
    setSelectedPerson(initialPerson)
    setStatusInfo(initialPerson?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : '')
  }, [initialPerson])

  useEffect(() => {
    setForm((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(proximaAcaoNumero, proximaAcaoUnidade) }))
  }, [proximaAcaoNumero, proximaAcaoUnidade])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (probRef.current && !probRef.current.contains(e.target as Node)) setProbOpen(false)
    }
    if (probOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [probOpen])

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'formaPagamento' && value !== 'parcelado') next.parcelas = ''
      return next
    })
  }, [])

  const handlePersonChange = useCallback((option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    setStatusInfo(option?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : '')
    if (option && fieldErrors.cliente) setFieldErrors((prev) => ({ ...prev, cliente: undefined }))
  }, [fieldErrors.cliente])

  const handleSubmit = async () => {
    const nextErrors: { cliente?: string } = {}
    if (!selectedPerson) nextErrors.cliente = 'Cliente ou lead obrigatorio.'
    if (nextErrors.cliente) {
      setFieldErrors(nextErrors)
      return
    }

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
      const valor = hasCartItems ? totalCarrinho : (valorManual ?? 0)

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo.trim() || null,
          descricao: form.descricao || null,
          valor,
          clienteId,
          formaPagamento: form.formaPagamento || null,
          parcelas: form.formaPagamento === 'parcelado' && form.parcelas ? parseInt(form.parcelas, 10) : null,
          desconto: parseCurrencyInput(form.desconto) ?? 0,
          probabilidade: getProbabilityValueFromLevel(
            PROBABILITY_LEVELS.includes(form.probabilidade) ? form.probabilidade : 'media'
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
      toast.success(data?.numero ? `Pedido #${data.numero} criado` : 'Pedido criado')
      onCreated()
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Erro ao criar pedido.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Pedido</h2>
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
            {fieldErrors.cliente && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.cliente}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Título</label>
            <input
              className={FIELD_CLASS}
              value={form.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Descrição</label>
            <textarea
              className={FIELD_CLASS}
              rows={2}
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <div>
              <label className={LABEL_CLASS}>Valor (R$)</label>
              <input
                className={FIELD_CLASS}
                value={hasCartItems ? currency(totalCarrinho) : form.valor}
                onChange={(e) => handleChange('valor', formatCurrencyInput(e.target.value))}
                disabled={hasCartItems}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Desconto (R$)</label>
              <input
                className={FIELD_CLASS}
                value={form.desconto}
                onChange={(e) => handleChange('desconto', formatCurrencyInput(e.target.value))}
              />
            </div>
            <div ref={probRef} className="relative">
              <label className={LABEL_CLASS}>Probabilidade</label>
              <button
                type="button"
                onClick={() => setProbOpen((o) => !o)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  form.probabilidade === 'alta'
                    ? 'border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : form.probabilidade === 'baixa'
                      ? 'border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="capitalize">{PROBABILITY_LABELS[form.probabilidade] ?? form.probabilidade}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${probOpen ? 'rotate-180' : ''}`} />
              </button>
              {probOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 min-w-[90px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  {PROBABILITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        handleChange('probabilidade', level)
                        setProbOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs capitalize transition hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        form.probabilidade === level
                          ? 'bg-violet-50 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {PROBABILITY_LABELS[level] ?? level}
                      {form.probabilidade === level && <span className="text-violet-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Forma de Pagamento</label>
              <select
                className={FIELD_CLASS}
                value={form.formaPagamento}
                onChange={(e) => handleChange('formaPagamento', e.target.value)}
              >
                {FORMA_PAGAMENTO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Parcelas</label>
              <input
                type="number"
                min={1}
                className={FIELD_CLASS}
                value={form.parcelas}
                onChange={(e) => handleChange('parcelas', e.target.value)}
                disabled={form.formaPagamento !== 'parcelado'}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleChange('lembreteProximaAcao', !form.lembreteProximaAcao)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              form.lembreteProximaAcao
                ? 'border-violet-400/60 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-950/40'
                : 'border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                form.lembreteProximaAcao
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Lembrete da próxima ação</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {form.lembreteProximaAcao
                  ? 'Você será notificado na data definida'
                  : 'Clique para ativar notificação'}
              </p>
            </div>
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                form.lembreteProximaAcao ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  form.lembreteProximaAcao ? 'left-5' : 'left-0.5'
                }`}
              />
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Data de Fechamento</label>
              <input
                type="date"
                className={FIELD_CLASS}
                value={form.dataFechamento}
                onChange={(e) => handleChange('dataFechamento', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Próxima Ação Em</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  className={`${FIELD_CLASS} w-20`}
                  value={proximaAcaoNumero}
                  onChange={(e) => setProximaAcaoNumero(Math.max(1, Number(e.target.value)))}
                />
                <select
                  className={FIELD_CLASS}
                  value={proximaAcaoUnidade}
                  onChange={(e) => setProximaAcaoUnidade(e.target.value as 'dias' | 'semanas' | 'meses')}
                >
                  <option value="dias">dias</option>
                  <option value="semanas">semanas</option>
                  <option value="meses">meses</option>
                </select>
              </div>
              {form.proximaAcaoEm && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {formatDate(form.proximaAcaoEm)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Canal</label>
              <select
                className={FIELD_CLASS}
                value={form.canalProximaAcao}
                onChange={(e) => handleChange('canalProximaAcao', e.target.value)}
              >
                {CANAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Responsável</label>
              <input
                className={FIELD_CLASS}
                value={form.responsavelProximaAcao}
                onChange={(e) => handleChange('responsavelProximaAcao', e.target.value)}
              />
            </div>
          </div>


          {hasCartItems && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Produtos: {itens.length} {itens.length === 1 ? 'item' : 'itens'} — {currency(totalCarrinho)}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={() => setShowCarrinhoDrawer(true)}>
            Adicionar produto {hasCartItems && `(${itens.length})`}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !selectedPerson}
          >
            <Save size={14} className="mr-1.5" />
            {loading ? 'Salvando...' : 'Criar Pedido'}
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
            Concluir
          </Button>
        }
      />
    </SideCreateDrawer>
  )
}
