'use client'

import type { ReactNode } from 'react'
import { AsyncSelect, Button } from '@/components/common'
import type { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { TIPOS_CONTRATO } from './constants'
import type { ContratoCustomField, ContratoFormState } from './types'
import { ContratoClausesFields } from './ContratoClausesFields'
import { ContratoPartiesFields } from './ContratoPartiesFields'

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export interface ContratoFormFieldsProps {
  form: ContratoFormState
  clienteLabel: string
  clausulasMode: 'manual' | 'paste'
  clausulasTextoBruto: string
  customFieldsContratante: ContratoCustomField[]
  customFieldsContratado: ContratoCustomField[]
  extraContent?: ReactNode
  onClienteChange: (opt: AsyncSelectOption | null) => void
  onFieldChange: <K extends keyof ContratoFormState>(field: K, value: ContratoFormState[K]) => void
  onClausulasModeChange: (mode: 'manual' | 'paste') => void
  onClausulasTextoBrutoChange: (value: string) => void
  onApplyClausulasTexto: () => void
  onClausulaChange: (idx: number, field: 'titulo' | 'conteudo', value: string) => void
  onAddClausula: () => void
  onRemoveClausula: (idx: number) => void
  onParteChange: (parte: 'contratante' | 'contratado', field: string, value: string) => void
  onAddCustomField: (parte: 'contratante' | 'contratado') => void
  onUpdateCustomField: (
    parte: 'contratante' | 'contratado',
    idx: number,
    field: 'key' | 'value',
    value: string
  ) => void
  onRemoveCustomField: (parte: 'contratante' | 'contratado', idx: number) => void
}

export function ContratoFormFields({
  form,
  clienteLabel,
  clausulasMode,
  clausulasTextoBruto,
  customFieldsContratante,
  customFieldsContratado,
  extraContent,
  onClienteChange,
  onFieldChange,
  onClausulasModeChange,
  onClausulasTextoBrutoChange,
  onApplyClausulasTexto,
  onClausulaChange,
  onAddClausula,
  onRemoveClausula,
  onParteChange,
  onAddCustomField,
  onUpdateCustomField,
  onRemoveCustomField,
}: ContratoFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Titulo</label>
        <input
          type="text"
          value={form.titulo}
          onChange={(event) => onFieldChange('titulo', event.target.value)}
          className={INPUT_CLASS}
          placeholder="Ex: Contrato de Prestacao de Servicos"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Tipo</label>
        <select
          value={form.tipo}
          onChange={(event) => onFieldChange('tipo', event.target.value)}
          className={INPUT_CLASS}
        >
          {TIPOS_CONTRATO.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>Cliente (opcional)</label>
        <AsyncSelect
          fetchUrl="/api/pessoas/busca"
          placeholder="Buscar cliente..."
          onChange={onClienteChange}
          initialLabel={clienteLabel || undefined}
        />
      </div>

      {extraContent}

      <div>
        <label className={LABEL_CLASS}>Preambulo</label>
        <textarea
          value={form.preambulo}
          onChange={(event) => onFieldChange('preambulo', event.target.value)}
          className={INPUT_CLASS}
          rows={3}
          placeholder="Texto introdutorio do contrato..."
        />
      </div>

      <ContratoClausesFields
        clausulas={form.clausulas}
        clausulasMode={clausulasMode}
        clausulasTextoBruto={clausulasTextoBruto}
        onClausulasModeChange={onClausulasModeChange}
        onClausulasTextoBrutoChange={onClausulasTextoBrutoChange}
        onApplyClausulasTexto={onApplyClausulasTexto}
        onClausulaChange={onClausulaChange}
        onAddClausula={onAddClausula}
        onRemoveClausula={onRemoveClausula}
      />

      <ContratoPartiesFields
        dadosPartes={form.dadosPartes}
        customFieldsContratante={customFieldsContratante}
        customFieldsContratado={customFieldsContratado}
        onParteChange={onParteChange}
        onAddCustomField={onAddCustomField}
        onUpdateCustomField={onUpdateCustomField}
        onRemoveCustomField={onRemoveCustomField}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL_CLASS}>Data inicio</label>
          <input
            type="date"
            value={form.dataInicio}
            onChange={(event) => onFieldChange('dataInicio', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Data fim</label>
          <input
            type="date"
            value={form.dataFim}
            onChange={(event) => onFieldChange('dataFim', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Data assinatura</label>
          <input
            type="date"
            value={form.dataAssinatura}
            onChange={(event) => onFieldChange('dataAssinatura', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Local de assinatura</label>
        <input
          type="text"
          value={form.localAssinatura}
          onChange={(event) => onFieldChange('localAssinatura', event.target.value)}
          className={INPUT_CLASS}
          placeholder="Ex: Sao Paulo, SP"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Observacoes</label>
        <textarea
          value={form.observacoes}
          onChange={(event) => onFieldChange('observacoes', event.target.value)}
          className={INPUT_CLASS}
          rows={2}
        />
      </div>
    </div>
  )
}
