'use client'

import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { AsyncSelect, Button, SideCreateDrawer } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import {
  getProbabilityLevel,
  getProbabilityValueFromLevel,
  type ProbabilityLevel,
} from '@/lib/domain/probabilidade'
import { Loader2, Save, X } from 'lucide-react'
import type { Pedido } from './types'
import { PROBABILITY_LEVELS } from './constants'
import { dateBr, dateInput, getPedidoSituacao, getProximaAcaoDate, parseCurrencyInput } from './utils'

interface EditPedidoDrawerProps {
  pedido: Pedido
  saving: boolean
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
}

export function EditPedidoDrawer({ pedido, saving, onClose, onSave, onCancelPedido }: EditPedidoDrawerProps) {
  const [fieldErrors, setFieldErrors] = useState<{ titulo?: string; cliente?: string }>({})
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>({
    id: pedido.oportunidade.clienteId,
    nome: pedido.oportunidade.cliente.nome,
    tipo: 'cliente',
  } as AsyncSelectOption)
  const [statusInfo, setStatusInfo] = useState<string | null>(null)
  const [proximaAcaoNumero, setProximaAcaoNumero] = useState(15)
  const [proximaAcaoUnidade, setProximaAcaoUnidade] = useState<'dias' | 'semanas' | 'meses'>('dias')
  const [form, setForm] = useState({
    titulo: pedido.oportunidade.titulo || '',
    descricao: pedido.oportunidade.descricao || '',
    valor: pedido.oportunidade.valor
      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.valor)
      : '',
    formaPagamento: pedido.oportunidade.formaPagamento || '',
    parcelas: pedido.oportunidade.parcelas ? String(pedido.oportunidade.parcelas) : '',
    desconto: pedido.oportunidade.desconto
      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.desconto)
      : '',
    probabilidade: getProbabilityLevel(pedido.oportunidade.probabilidade || 0),
    dataFechamento: dateInput(pedido.oportunidade.dataFechamento),
    proximaAcaoEm: dateInput(pedido.oportunidade.proximaAcaoEm),
    canalProximaAcao: pedido.oportunidade.canalProximaAcao || '',
    responsavelProximaAcao: pedido.oportunidade.responsavelProximaAcao || '',
    lembreteProximaAcao: pedido.oportunidade.lembreteProximaAcao === true,
  })

  useEffect(() => {
    setSelectedPerson({
      id: pedido.oportunidade.clienteId,
      nome: pedido.oportunidade.cliente.nome,
      tipo: 'cliente',
    } as AsyncSelectOption)
    setStatusInfo(null)
    setFieldErrors({})
    setForm({
      titulo: pedido.oportunidade.titulo || '',
      descricao: pedido.oportunidade.descricao || '',
      valor: pedido.oportunidade.valor
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.valor)
        : '',
      formaPagamento: pedido.oportunidade.formaPagamento || '',
      parcelas: pedido.oportunidade.parcelas ? String(pedido.oportunidade.parcelas) : '',
      desconto: pedido.oportunidade.desconto
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pedido.oportunidade.desconto)
        : '',
      probabilidade: getProbabilityLevel(pedido.oportunidade.probabilidade || 0),
      dataFechamento: dateInput(pedido.oportunidade.dataFechamento),
      proximaAcaoEm: dateInput(pedido.oportunidade.proximaAcaoEm),
      canalProximaAcao: pedido.oportunidade.canalProximaAcao || '',
      responsavelProximaAcao: pedido.oportunidade.responsavelProximaAcao || '',
      lembreteProximaAcao: pedido.oportunidade.lembreteProximaAcao === true,
    })
  }, [pedido])

  const situacao = getPedidoSituacao(pedido)
  const bloqueado = situacao === 'cancelado'
  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700'
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

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

  const handleSave = async () => {
    const nextErrors: { titulo?: string; cliente?: string } = {}
    if (!form.titulo.trim()) nextErrors.titulo = 'Titulo obrigatorio.'
    if (!selectedPerson) nextErrors.cliente = 'Cliente ou lead obrigatorio.'
    if (nextErrors.titulo || nextErrors.cliente) {
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
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: error instanceof Error ? error.message : 'Nao foi possivel converter o lead.',
        })
        return
      }
    }

    if (!clienteId) {
      await Swal.fire({ icon: 'error', title: 'Cliente invalido', text: 'Nao foi possivel identificar o cliente.' })
      return
    }

    setFieldErrors({})
    onSave({
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      valor: form.valor ? parseCurrencyInput(form.valor) : null,
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
    })
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Pedido #{pedido.numero}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pedido.oportunidade.titulo} - {pedido.oportunidade.cliente.nome}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void handleSave() }}>
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Identificacao
            </p>
            <div className="mt-3 space-y-4">
              <div>
                <label className={labelClass}>
                  Titulo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={`${fieldClass} ${fieldErrors.titulo ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Ex: Orcamento de servico para empresa X"
                />
                {fieldErrors.titulo && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.titulo}</p>
                )}
              </div>

              <div>
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
                {fieldErrors.cliente && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.cliente}</p>
                )}
                {statusInfo && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{statusInfo}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Descricao</label>
                <textarea
                  name="descricao"
                  rows={3}
                  value={form.descricao}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={fieldClass}
                  placeholder="Descricao detalhada do pedido"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Comercial e acompanhamento
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input
                  type="text"
                  name="valor"
                  value={form.valor}
                  onChange={handleCurrencyChange('valor')}
                  disabled={bloqueado}
                  className={fieldClass}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className={labelClass}>Forma de Pagamento</label>
                <select
                  name="formaPagamento"
                  value={form.formaPagamento}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartao</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Desconto (R$)</label>
                <input
                  type="text"
                  name="desconto"
                  value={form.desconto}
                  onChange={handleCurrencyChange('desconto')}
                  disabled={bloqueado}
                  className={fieldClass}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className={labelClass}>Probabilidade</label>
                <select
                  name="probabilidade"
                  value={form.probabilidade}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={fieldClass}
                >
                  <option value="baixa">baixa</option>
                  <option value="media">media</option>
                  <option value="alta">alta</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Parcelas</label>
                <input
                  type="number"
                  name="parcelas"
                  min="2"
                  max="24"
                  value={form.parcelas}
                  onChange={handleChange}
                  disabled={bloqueado || form.formaPagamento !== 'parcelado'}
                  className={fieldClass}
                  placeholder={form.formaPagamento === 'parcelado' ? 'Ex: 3' : 'Somente parcelado'}
                />
              </div>

              <div>
                <label className={labelClass}>Data Prevista</label>
                <input
                  type="date"
                  name="dataFechamento"
                  value={form.dataFechamento}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={`${fieldClass} dark:scheme-dark`}
                />
              </div>

              <div>
                <label className={labelClass}>Proxima Acao</label>
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
                    disabled={bloqueado}
                    className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <select
                    value={proximaAcaoUnidade}
                    onChange={(e) => {
                      const u = e.target.value as 'dias' | 'semanas' | 'meses'
                      setProximaAcaoUnidade(u)
                      setForm((prev) => ({ ...prev, proximaAcaoEm: getProximaAcaoDate(proximaAcaoNumero, u) }))
                    }}
                    disabled={bloqueado}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="dias">dias</option>
                    <option value="semanas">semanas</option>
                    <option value="meses">meses</option>
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({dateBr(form.proximaAcaoEm)})
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Canal da Acao</label>
                <select
                  name="canalProximaAcao"
                  value={form.canalProximaAcao}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="ligacao">Ligacao</option>
                  <option value="reuniao">Reuniao</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Responsavel</label>
                <input
                  type="text"
                  name="responsavelProximaAcao"
                  value={form.responsavelProximaAcao}
                  onChange={handleChange}
                  disabled={bloqueado}
                  className={fieldClass}
                  placeholder="Ex: Joao"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="lembreteProximaAcao"
              checked={form.lembreteProximaAcao}
              onChange={handleChange}
              disabled={bloqueado}
              className="h-4 w-4 rounded-sm border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600"
            />
            Gerar lembrete para a proxima acao
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
            {situacao === 'pedido' && (
              <Button type="button" variant="outline" onClick={onCancelPedido} disabled={saving}>
                Cancelar pedido
              </Button>
            )}
            <Button type="submit" disabled={bloqueado || saving}>
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
