'use client'

import { Button } from '@/components/common'
import { Plus, Trash2 } from '@/lib/icons'
import type { ContratoCustomField, DadosPartes } from './types'

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface ContratoPartiesFieldsProps {
  dadosPartes: DadosPartes
  customFieldsContratante: ContratoCustomField[]
  customFieldsContratado: ContratoCustomField[]
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

function renderCustomFields(
  parte: 'contratante' | 'contratado',
  fields: ContratoCustomField[],
  onUpdateCustomField: ContratoPartiesFieldsProps['onUpdateCustomField'],
  onRemoveCustomField: ContratoPartiesFieldsProps['onRemoveCustomField']
) {
  return fields.map((field, idx) => (
    <div key={`${parte}-${idx}`} className="flex gap-2">
      <input
        type="text"
        value={field.key}
        onChange={(event) => onUpdateCustomField(parte, idx, 'key', event.target.value)}
        className={`${INPUT_CLASS} flex-1`}
        placeholder="Ex: Cargo, RG"
      />
      <input
        type="text"
        value={field.value}
        onChange={(event) => onUpdateCustomField(parte, idx, 'value', event.target.value)}
        className={`${INPUT_CLASS} flex-1`}
        placeholder="Valor"
      />
      <button
        type="button"
        onClick={() => onRemoveCustomField(parte, idx)}
        className="rounded p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        aria-label="Remover campo"
      >
        <Trash2 size={16} />
      </button>
    </div>
  ))
}

export function ContratoPartiesFields({
  dadosPartes,
  customFieldsContratante,
  customFieldsContratado,
  onParteChange,
  onAddCustomField,
  onUpdateCustomField,
  onRemoveCustomField,
}: ContratoPartiesFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={LABEL_CLASS}>Contratante</label>
        <div className="space-y-2">
          <input
            type="text"
            value={dadosPartes.contratante?.nome ?? ''}
            onChange={(event) => onParteChange('contratante', 'nome', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Nome / Razao Social"
          />
          <input
            type="text"
            value={dadosPartes.contratante?.documento ?? ''}
            onChange={(event) => onParteChange('contratante', 'documento', event.target.value)}
            className={INPUT_CLASS}
            placeholder="CPF/CNPJ"
          />
          <input
            type="text"
            value={dadosPartes.contratante?.rg ?? ''}
            onChange={(event) => onParteChange('contratante', 'rg', event.target.value)}
            className={INPUT_CLASS}
            placeholder="RG"
          />
          <input
            type="text"
            value={dadosPartes.contratante?.endereco ?? ''}
            onChange={(event) => onParteChange('contratante', 'endereco', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Endereco"
          />
          {renderCustomFields('contratante', customFieldsContratante, onUpdateCustomField, onRemoveCustomField)}
          <Button size="sm" variant="outline" onClick={() => onAddCustomField('contratante')}>
            <Plus size={14} className="mr-1" /> Adicionar campo
          </Button>
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Contratado</label>
        <div className="space-y-2">
          <input
            type="text"
            value={dadosPartes.contratado?.nome ?? ''}
            onChange={(event) => onParteChange('contratado', 'nome', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Nome / Razao Social"
          />
          <input
            type="text"
            value={dadosPartes.contratado?.documento ?? ''}
            onChange={(event) => onParteChange('contratado', 'documento', event.target.value)}
            className={INPUT_CLASS}
            placeholder="CPF/CNPJ"
          />
          <input
            type="text"
            value={dadosPartes.contratado?.rg ?? ''}
            onChange={(event) => onParteChange('contratado', 'rg', event.target.value)}
            className={INPUT_CLASS}
            placeholder="RG"
          />
          <input
            type="text"
            value={dadosPartes.contratado?.endereco ?? ''}
            onChange={(event) => onParteChange('contratado', 'endereco', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Endereco"
          />
          {renderCustomFields('contratado', customFieldsContratado, onUpdateCustomField, onRemoveCustomField)}
          <Button size="sm" variant="outline" onClick={() => onAddCustomField('contratado')}>
            <Plus size={14} className="mr-1" /> Adicionar campo
          </Button>
        </div>
      </div>
    </div>
  )
}
