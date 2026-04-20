'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { AsyncSelect, Button, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import {
  getProbabilityLevel,
  getProbabilityValueFromLevel,
  type ProbabilityLevel,
} from '@/lib/domain/probabilidade'
import { Bell, ChevronDown, Info, Loader2, Save, X } from '@/lib/icons'
import { formatDate } from '@/lib/format'
import { FIELD_CLASS, LABEL_CLASS, CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from '@/components/features/oportunidades/constants'
import { formatCurrencyInput, currency } from '@/components/features/oportunidades/utils'
import type { Pedido } from './types'
import { PROBABILITY_LEVELS } from './constants'
import { dateInput, getPedidoSituacao, getProximaAcaoDate, parseCurrencyInput } from './utils'

const PROBABILITY_LABELS: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

interface EditPedidoDrawerProps {
  pedido: Pedido
  readOnly?: boolean
  saving: boolean
  itemsCount?: number
  onClose: () => void
  onSave: (values: {
    titulo: string
    descricao: string | null
    valor: number | null
    clienteId: string
    formaPagamento: string | null
    parcelas: number | null
    desconto: number | null
    probabilidade: number
    dataFechamento: string | null
    proximaAcaoEm: string | null
    canalProximaAcao: string | null
    responsavelProximaAcao: string | null
    lembreteProximaAcao: boolean
  }) => void
  onCancelPedido: () => void
  onOpenAdicionarProduto?: () => void
}

export function EditPedidoDrawer({
  pedido,
  readOnly = false,
  saving,
  itemsCount = 0,
  onClose,
  onSave,
  onCancelPedido,
  onOpenAdicionarProduto,
}: EditPedidoDrawerProps) {
  const [fieldErrors, setFieldErrors] = useState<{ cliente?: string }>({})
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>({
    id: pedido.oportunidade.clienteId,
    nome: pedido.oportunidade.cliente.nome,
    tipo: 'cliente',
  } as AsyncSelectOption)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)
  const [probOpen, setProbOpen] = useState(false)
  const probRef = useRef<HTMLDivElement>(null)
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')
  const hasCartItems = itemsCount > 0
  const totalFromItems = hasCartItems ? pedido.totalLiquido : 0

  const [form, setForm] = useState({
    titulo: pedido.oportunidade.titulo || '',
    descricao: pedido.oportunidade.descricao || '',
    valor: hasCartItems
      ? ''
      : pedido.oportunidade.valor
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.valor)
        : '',
    formaPagamento: pedido.oportunidade.formaPagamento || '',
    parcelas: pedido.oportunidade.parcelas ? String(pedido.oportunidade.parcelas) : '',
    desconto: pedido.oportunidade.desconto
      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.desconto)
      : '',
    probabilidade: getProbabilityLevel(pedido.oportunidade.probabilidade || 0) as ProbabilityLevel,
    dataFechamento: dateInput(pedido.oportunidade.dataFechamento),
    proximaAcaoEm: dateInput(pedido.oportunidade.proximaAcaoEm),
    canalProximaAcao: pedido.oportunidade.canalProximaAcao || '',
    responsavelProximaAcao: pedido.oportunidade.responsavelProximaAcao || '',
    lembreteProximaAcao: pedido.oportunidade.lembreteProximaAcao === true,
  })

  useEffect(() => {
    const proximaDate = pedido.oportunidade.proximaAcaoEm
      ? new Date(pedido.oportunidade.proximaAcaoEm)
      : null
    let num = 15
    let un: 'dias' | 'semanas' | 'meses' = 'dias'
    if (proximaDate) {
      const today = new Date()
      const diff = proximaDate.getTime() - today.getTime()
      const days = Math.round(diff / (1000 * 60 * 60 * 24))
      if (days >= 30 && days % 30 < 15) {
        num = Math.floor(days / 30)
        un = 'meses'
      } else if (days >= 7 && days % 7 < 4) {
        num = Math.floor(days / 7)
        un = 'semanas'
      } else {
        num = Math.max(1, days)
        un = 'dias'
      }
    }
    setProximaAcaoNumero(num)
    setProximaAcaoUnidade(un)
  }, [pedido.oportunidade.proximaAcaoEm])

  useEffect(() => {
    setSelectedPerson({
      id: pedido.oportunidade.clienteId,
      nome: pedido.oportunidade.cliente.nome,
      tipo: 'cliente',
    } as AsyncSelectOption)
    setStatusInfo(null)
    setFieldErrors({})
    const hasItems = itemsCount > 0
    setForm({
      titulo: pedido.oportunidade.titulo || '',
      descricao: pedido.oportunidade.descricao || '',
      valor: hasItems
        ? ''
        : pedido.oportunidade.valor
          ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.valor)
          : '',
      formaPagamento: pedido.oportunidade.formaPagamento || '',
      parcelas: pedido.oportunidade.parcelas ? String(pedido.oportunidade.parcelas) : '',
      desconto: pedido.oportunidade.desconto
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.desconto)
        : '',
      probabilidade: getProbabilityLevel(pedido.oportunidade.probabilidade || 0) as ProbabilityLevel,
      dataFechamento: dateInput(pedido.oportunidade.dataFechamento),
      proximaAcaoEm: dateInput(pedido.oportunidade.proximaAcaoEm) || getProximaAcaoDate(15, 'dias'),
      canalProximaAcao: pedido.oportunidade.canalProximaAcao || '',
      responsavelProximaAcao: pedido.oportunidade.responsavelProximaAcao || '',
      lembreteProximaAcao: pedido.oportunidade.lembreteProximaAcao === true,
    })
  }, [pedido, itemsCount])

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

  const situacao = getPedidoSituacao(pedido)
  const bloqueado = situacao === 'cancelado' || readOnly

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'formaPagamento' && value !== 'parcelado') next.parcelas = ''
      return next
    })
  }, [])

  const handlePersonChange = useCallback((option: AsyncSelectOption | null) => {
    setSelectedPerson(option)
    setStatusInfo(option?.tipo === 'prospecto' ? 'Este lead sera convertido em cliente automaticamente.' : null)
    if (option && fieldErrors.cliente) setFieldErrors((prev) => ({ ...prev, cliente: undefined }))
  }, [fieldErrors.cliente])

  const handleSave = async () => {
    const nextErrors: { cliente?: string } = {}
    if (!selectedPerson) nextErrors.cliente = 'Cliente ou lead obrigatorio.'
    if (nextErrors.cliente) {
      setFieldErrors(nextErrors)
      return
    }

    let clienteId = selectedPerson?.tipo === 'cliente' ? selectedPerson.id : null
    if (selectedPerson?.tipo === 'prospecto') {
      try {
        const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, { method: 'POST' })
        const convData = await convRes.json().catch(() => null)
        if (!convRes.ok) {
          if (convRes.status === 409 && convData?.clienteId) clienteId = convData.clienteId
          else throw new Error(convData?.error || 'Erro ao converter lead em cliente')
        } else {
          clienteId = convData?.cliente?.id || null
        }
      } catch (error) {
        toast.error('Erro', { description: error instanceof Error ? error.message : 'Nao foi possivel converter o lead.' })
        return
      }
    }

    if (!clienteId) {
      toast.error('Cliente invalido', { description: 'Nao foi possivel identificar o cliente.' })
      return
    }

    const valorFinal = hasCartItems ? totalFromItems : (form.valor ? parseCurrencyInput(form.valor) : null)
    setFieldErrors({})
    onSave({
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      valor: valorFinal,
      clienteId,
      formaPagamento: form.formaPagamento || null,
      parcelas: form.formaPagamento === 'parcelado' && form.parcelas ? parseInt(form.parcelas, 10) : null,
      desconto: form.desconto ? parseCurrencyInput(form.desconto) : null,
      probabilidade: getProbabilityValueFromLevel(
        PROBABILITY_LEVELS.includes(form.probabilidade) ? form.probabilidade : 'media'
      ),
      dataFechamento: form.dataFechamento || null,
      proximaAcaoEm: form.proximaAcaoEm || null,
      canalProximaAcao: form.canalProximaAcao || null,
      responsavelProximaAcao: form.responsavelProximaAcao || null,
      lembreteProximaAcao: form.lembreteProximaAcao,
    })
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {readOnly ? 'Ver Pedido' : 'Editar Pedido'} #{pedido.numero}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pedido.oportunidade.titulo} — {pedido.oportunidade.cliente.nome}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); void handleSave() }}>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div>
              <label className={LABEL_CLASS}>Cliente / Lead</label>
              <AsyncSelect
                fetchUrl="/api/pessoas/busca?context=oportunidade"
                value={selectedPerson?.id || ''}
                initialLabel={selectedPerson?.nome || ''}
                onChange={handlePersonChange}
                placeholder="Buscar cliente ou lead..."
                disabled={bloqueado}
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
                className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                value={form.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="Opcional"
                disabled={bloqueado}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Descrição</label>
              <textarea
                className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                rows={2}
                value={form.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                disabled={bloqueado}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <div>
                <label className={LABEL_CLASS}>Valor (R$)</label>
                <input
                  className={`${FIELD_CLASS} ${bloqueado || hasCartItems ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={hasCartItems ? currency(totalFromItems) : form.valor}
                  onChange={(e) => handleChange('valor', formatCurrencyInput(e.target.value))}
                  disabled={bloqueado || hasCartItems}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Desconto (R$)</label>
                <input
                  className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.desconto}
                  onChange={(e) => handleChange('desconto', formatCurrencyInput(e.target.value))}
                  disabled={bloqueado}
                />
              </div>
              <div ref={probRef} className="relative">
                <label className={LABEL_CLASS}>Probabilidade</label>
                <button
                  type="button"
                  onClick={() => !bloqueado && setProbOpen((o) => !o)}
                  disabled={bloqueado}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Forma de Pagamento</label>
                <select
                  className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.formaPagamento}
                  onChange={(e) => handleChange('formaPagamento', e.target.value)}
                  disabled={bloqueado}
                >
                  {FORMA_PAGAMENTO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Parcelas</label>
                <input
                  type="number"
                  min={1}
                  className={`${FIELD_CLASS} ${bloqueado || form.formaPagamento !== 'parcelado' ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.parcelas}
                  onChange={(e) => handleChange('parcelas', e.target.value)}
                  disabled={bloqueado || form.formaPagamento !== 'parcelado'}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => !bloqueado && handleChange('lembreteProximaAcao', !form.lembreteProximaAcao)}
              disabled={bloqueado}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Data de Fechamento</label>
                <input
                  type="date"
                  className={`${FIELD_CLASS} dark:scheme-dark ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.dataFechamento}
                  onChange={(e) => handleChange('dataFechamento', e.target.value)}
                  disabled={bloqueado}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Próxima Ação Em</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    className={`${FIELD_CLASS} w-20 ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                    value={proximaAcaoNumero}
                    onChange={(e) => setProximaAcaoNumero(Math.max(1, Number(e.target.value)))}
                    disabled={bloqueado}
                  />
                  <select
                    className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                    value={proximaAcaoUnidade}
                    onChange={(e) => setProximaAcaoUnidade(e.target.value as 'dias' | 'semanas' | 'meses')}
                    disabled={bloqueado}
                  >
                    <option value="dias">dias</option>
                    <option value="semanas">semanas</option>
                    <option value="meses">meses</option>
                  </select>
                </div>
                {form.proximaAcaoEm && (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{formatDate(form.proximaAcaoEm)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Canal</label>
                <select
                  className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.canalProximaAcao}
                  onChange={(e) => handleChange('canalProximaAcao', e.target.value)}
                  disabled={bloqueado}
                >
                  {CANAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Responsável</label>
                <input
                  className={`${FIELD_CLASS} ${bloqueado ? 'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700' : ''}`}
                  value={form.responsavelProximaAcao}
                  onChange={(e) => handleChange('responsavelProximaAcao', e.target.value)}
                  disabled={bloqueado}
                />
              </div>
            </div>


            {hasCartItems && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Produtos: {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} — {currency(totalFromItems)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {!readOnly && onOpenAdicionarProduto && (
                <Button type="button" variant="outline" size="sm" onClick={onOpenAdicionarProduto}>
                  Adicionar produto {hasCartItems && `(${itemsCount})`}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && situacao === 'pedido' && (
                <Button type="button" variant="danger" onClick={onCancelPedido} disabled={saving}>
                  Cancelar pedido
                </Button>
              )}
              {!readOnly && (
                <Button type="submit" onClick={() => void handleSave()} disabled={bloqueado || saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} className="mr-1.5" />Salvar</>}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
