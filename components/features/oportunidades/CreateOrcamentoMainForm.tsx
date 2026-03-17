'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Info } from '@/lib/icons'
import { AsyncSelect } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import type { OrcamentoFormData } from './types'
import { FIELD_CLASS, LABEL_CLASS, FORMA_PAGAMENTO_OPTIONS } from './constants'
import { currency } from './utils'
import OrcamentoProximaAcaoSection from './OrcamentoProximaAcaoSection'
import type { ProbabilityLevel } from '@/lib/domain/probabilidade'

interface CreateOrcamentoMainFormProps {
  selectedPerson: AsyncSelectOption | null
  nomeClienteAvulso: string
  statusInfo: string
  formData: OrcamentoFormData
  hasCartItems: boolean
  totalCarrinho: number
  itensLength: number
  proximaAcaoNumero: number
  proximaAcaoUnidade: 'dias' | 'semanas' | 'meses'
  onPersonChange: (option: AsyncSelectOption | null) => void
  onNomeClienteAvulsoChange: (value: string) => void
  onChange: (field: keyof OrcamentoFormData, value: string | boolean) => void
  onCurrencyChange: (raw: string) => void
  onDiscountCurrencyChange: (raw: string) => void
  onProximaAcaoNumeroChange: (value: number) => void
  onProximaAcaoUnidadeChange: (value: 'dias' | 'semanas' | 'meses') => void
}

const PROBABILITY_LEVELS: ProbabilityLevel[] = ['baixa', 'media', 'alta']
const PROBABILITY_LABELS: Record<string, string> = { baixa: 'Baixa', media: 'Media', alta: 'Alta' }

export default function CreateOrcamentoMainForm({
  selectedPerson,
  nomeClienteAvulso,
  statusInfo,
  formData,
  hasCartItems,
  totalCarrinho,
  itensLength,
  proximaAcaoNumero,
  proximaAcaoUnidade,
  onPersonChange,
  onNomeClienteAvulsoChange,
  onChange,
  onCurrencyChange,
  onDiscountCurrencyChange,
  onProximaAcaoNumeroChange,
  onProximaAcaoUnidadeChange,
}: CreateOrcamentoMainFormProps) {
  const [probOpen, setProbOpen] = useState(false)
  const probRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (probRef.current && !probRef.current.contains(e.target as Node)) setProbOpen(false)
    }
    if (probOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [probOpen])

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      <div>
        <label className={LABEL_CLASS}>Cliente / Lead</label>
        <AsyncSelect
          fetchUrl="/api/pessoas/busca?context=oportunidade"
          value={selectedPerson?.id || ''}
          initialLabel={selectedPerson?.nome || ''}
          onChange={onPersonChange}
          placeholder="Buscar cliente ou lead..."
        />
        {statusInfo && (
          <p className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-300">
            <Info size={12} /> {statusInfo}
          </p>
        )}
        <div className="mt-2">
          <label className={LABEL_CLASS}>Ou nomeie um cliente rapido</label>
          <input
            className={FIELD_CLASS}
            value={nomeClienteAvulso}
            onChange={(e) => onNomeClienteAvulsoChange(e.target.value)}
            placeholder="Ex.: Cliente avulso"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Se preencher, um cliente minimo sera criado automaticamente para este orcamento.
          </p>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Titulo</label>
        <input className={FIELD_CLASS} value={formData.titulo} onChange={(e) => onChange('titulo', e.target.value)} placeholder="Opcional" />
      </div>

      <div>
        <label className={LABEL_CLASS}>Descricao</label>
        <textarea className={FIELD_CLASS} rows={2} value={formData.descricao} onChange={(e) => onChange('descricao', e.target.value)} />
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
        <div>
          <label className={LABEL_CLASS}>Valor (R$)</label>
          <input className={FIELD_CLASS} value={hasCartItems ? currency(totalCarrinho) : formData.valor} onChange={(e) => onCurrencyChange(e.target.value)} disabled={hasCartItems} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Desconto (R$)</label>
          <input className={FIELD_CLASS} value={formData.desconto} onChange={(e) => onDiscountCurrencyChange(e.target.value)} />
        </div>
        <div ref={probRef} className="relative">
          <label className={LABEL_CLASS}>Probabilidade</label>
          <button
            type="button"
            onClick={() => setProbOpen((open) => !open)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${formData.probabilidade === 'alta' ? 'border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200' : formData.probabilidade === 'baixa' ? 'border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200' : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'}`}
          >
            <span className="capitalize">{PROBABILITY_LABELS[formData.probabilidade] ?? formData.probabilidade}</span>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${probOpen ? 'rotate-180' : ''}`} />
          </button>
          {probOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[90px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {PROBABILITY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    onChange('probabilidade', level)
                    setProbOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs capitalize transition hover:bg-gray-100 dark:hover:bg-gray-700 ${formData.probabilidade === level ? 'bg-violet-50 font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {PROBABILITY_LABELS[level] ?? level}
                  {formData.probabilidade === level && <span className="text-violet-500">OK</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Forma de Pagamento</label>
          <select className={FIELD_CLASS} value={formData.formaPagamento} onChange={(e) => onChange('formaPagamento', e.target.value)}>
            {FORMA_PAGAMENTO_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Parcelas</label>
          <input type="number" min={1} className={FIELD_CLASS} value={formData.parcelas} onChange={(e) => onChange('parcelas', e.target.value)} />
        </div>
      </div>

      <OrcamentoProximaAcaoSection
        formData={formData}
        proximaAcaoNumero={proximaAcaoNumero}
        proximaAcaoUnidade={proximaAcaoUnidade}
        onChange={onChange}
        onProximaAcaoNumeroChange={onProximaAcaoNumeroChange}
        onProximaAcaoUnidadeChange={onProximaAcaoUnidadeChange}
      />

      {hasCartItems && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Carrinho: {itensLength} {itensLength === 1 ? 'item' : 'itens'} - {currency(totalCarrinho)}
          </p>
        </div>
      )}
    </div>
  )
}
