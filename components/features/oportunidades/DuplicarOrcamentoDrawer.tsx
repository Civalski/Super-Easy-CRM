'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save, X } from '@/lib/icons'
import { toast } from '@/lib/toast'
import { Button, SideCreateDrawer, AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { getProbabilityLevel, getProbabilityValueFromLevel, type ProbabilityLevel } from '@/lib/domain/probabilidade'
import type { OrcamentoFormData } from './types'
import { FIELD_CLASS, LABEL_CLASS, CANAL_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from './constants'
import { formatDateInput, parseCurrencyInput, formatCurrencyInput } from './utils'

interface DuplicarOrcamentoDrawerProps {
  oportunidadeId: string
  onClose: () => void
  onDuplicated: () => void
}

const PROBABILITY_LEVELS: ProbabilityLevel[] = ['baixa', 'media', 'alta']
const PROBABILITY_LABELS: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

export default function DuplicarOrcamentoDrawer({ oportunidadeId, onClose, onDuplicated }: DuplicarOrcamentoDrawerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)
  const [formData, setFormData] = useState<OrcamentoFormData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/oportunidades/${oportunidadeId}`)
        if (!res.ok) throw new Error()
        const d = await res.json()
        if (!active) return
        const tituloOriginal = d.titulo || ''
        setFormData({
          titulo: tituloOriginal ? `Cópia de ${tituloOriginal}` : '',
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
      } catch {
        if (!active) return
        toast.error('Erro', { description: 'Não foi possível carregar o orçamento.' })
        onClose()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [oportunidadeId, onClose])

  const handleChange = useCallback((field: keyof OrcamentoFormData, value: string | boolean) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedPerson || !formData) return
    setSaving(true)
    try {
      const valor = parseCurrencyInput(formData.valor) ?? 0
      const body = {
        clienteId: selectedPerson.id,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao || null,
        valor,
        formaPagamento: formData.formaPagamento || null,
        parcelas: formData.parcelas ? Number(formData.parcelas) : null,
        desconto: parseCurrencyInput(formData.desconto) ?? 0,
        probabilidade: getProbabilityValueFromLevel(formData.probabilidade as ProbabilityLevel),
        dataFechamento: formData.dataFechamento || null,
        proximaAcaoEm: formData.proximaAcaoEm || null,
        canalProximaAcao: formData.canalProximaAcao || null,
        responsavelProximaAcao: formData.responsavelProximaAcao || null,
        lembreteProximaAcao: formData.lembreteProximaAcao,
        status: 'orcamento',
      }
      const res = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Falha ao duplicar orçamento')
      }
      toast.success('Orçamento duplicado!')
      onDuplicated()
    } catch (err: unknown) {
      toast.error('Erro', { description: err instanceof Error ? err.message : 'Erro ao duplicar orçamento' })
    } finally {
      setSaving(false)
    }
  }, [selectedPerson, formData, onDuplicated])

  if (loading || !formData) {
    return (
      <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </SideCreateDrawer>
    )
  }

  return (
    <SideCreateDrawer open onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Duplicar Orçamento</h2>
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
            <label className={LABEL_CLASS}>Cliente *</label>
            <AsyncSelect
              fetchUrl="/api/clientes/busca"
              value={selectedPerson?.id || ''}
              initialLabel={selectedPerson?.nome || ''}
              onChange={setSelectedPerson}
              placeholder="Selecione o cliente para o orçamento duplicado..."
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              O orçamento duplicado receberá um novo número automaticamente.
            </p>
          </div>

          <div>
            <label className={LABEL_CLASS}>Título</label>
            <input
              className={FIELD_CLASS}
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Descrição</label>
            <textarea
              className={FIELD_CLASS}
              rows={2}
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Valor (R$)</label>
              <input
                className={FIELD_CLASS}
                value={formData.valor}
                onChange={(e) => handleChange('valor', formatCurrencyInput(e.target.value))}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Desconto (R$)</label>
              <input
                className={FIELD_CLASS}
                value={formData.desconto}
                onChange={(e) => handleChange('desconto', formatCurrencyInput(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Forma de Pagamento</label>
              <select
                className={FIELD_CLASS}
                value={formData.formaPagamento}
                onChange={(e) => handleChange('formaPagamento', e.target.value)}
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
                className={FIELD_CLASS}
                value={formData.parcelas}
                onChange={(e) => handleChange('parcelas', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Probabilidade</label>
              <select
                className={FIELD_CLASS}
                value={formData.probabilidade}
                onChange={(e) => handleChange('probabilidade', e.target.value)}
              >
                {PROBABILITY_LEVELS.map((l) => (
                  <option key={l} value={l}>{PROBABILITY_LABELS[l] ?? l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Data de Fechamento</label>
              <input
                type="date"
                className={FIELD_CLASS}
                value={formData.dataFechamento}
                onChange={(e) => handleChange('dataFechamento', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Próxima Ação Em</label>
              <input
                type="date"
                className={FIELD_CLASS}
                value={formData.proximaAcaoEm}
                onChange={(e) => handleChange('proximaAcaoEm', e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Canal</label>
              <select
                className={FIELD_CLASS}
                value={formData.canalProximaAcao}
                onChange={(e) => handleChange('canalProximaAcao', e.target.value)}
              >
                {CANAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Responsável</label>
            <input
              className={FIELD_CLASS}
              value={formData.responsavelProximaAcao}
              onChange={(e) => handleChange('responsavelProximaAcao', e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={formData.lembreteProximaAcao}
              onChange={(e) => handleChange('lembreteProximaAcao', e.target.checked)}
              className="rounded border-gray-600"
            />
            Lembrete da próxima ação
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !selectedPerson}>
            <Save size={14} className="mr-1.5" />
            {saving ? 'Duplicando...' : 'Duplicar Orçamento'}
          </Button>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
