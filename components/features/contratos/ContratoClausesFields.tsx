'use client'

import { Button } from '@/components/common'
import { FileText, Plus, Trash2 } from '@/lib/icons'
import type { Clausula } from './types'

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

interface ContratoClausesFieldsProps {
  clausulas: Clausula[]
  clausulasMode: 'manual' | 'paste'
  clausulasTextoBruto: string
  onClausulasModeChange: (mode: 'manual' | 'paste') => void
  onClausulasTextoBrutoChange: (value: string) => void
  onApplyClausulasTexto: () => void
  onClausulaChange: (idx: number, field: 'titulo' | 'conteudo', value: string) => void
  onAddClausula: () => void
  onRemoveClausula: (idx: number) => void
}

export function ContratoClausesFields({
  clausulas,
  clausulasMode,
  clausulasTextoBruto,
  onClausulasModeChange,
  onClausulasTextoBrutoChange,
  onApplyClausulasTexto,
  onClausulaChange,
  onAddClausula,
  onRemoveClausula,
}: ContratoClausesFieldsProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>Clausulas</label>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => onClausulasModeChange('manual')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            clausulasMode === 'manual'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
          }`}
        >
          Uma a uma
        </button>
        <button
          type="button"
          onClick={() => onClausulasModeChange('paste')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            clausulasMode === 'paste'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
          }`}
        >
          <FileText size={14} /> Texto
        </button>
      </div>

      {clausulasMode === 'paste' ? (
        <div className="space-y-2">
          <textarea
            value={clausulasTextoBruto}
            onChange={(event) => onClausulasTextoBrutoChange(event.target.value)}
            className={INPUT_CLASS}
            rows={12}
            placeholder={`Cole aqui o texto com as clausulas.

1. Objeto do contrato
O presente contrato tem por objeto...

2. Vigencia
O contrato vigorara pelo prazo de...`}
          />
          <Button size="sm" variant="outline" onClick={onApplyClausulasTexto}>
            Aplicar e editar clausulas
          </Button>
        </div>
      ) : (
        <>
          {clausulas.map((clausula, idx) => (
            <div key={idx} className="mb-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Clausula {idx + 1}</span>
                {clausulas.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveClausula(idx)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              <input
                type="text"
                value={clausula.titulo}
                onChange={(event) => onClausulaChange(idx, 'titulo', event.target.value)}
                className={`${INPUT_CLASS} mb-2`}
                placeholder="Titulo da clausula"
              />
              <textarea
                value={clausula.conteudo}
                onChange={(event) => onClausulaChange(idx, 'conteudo', event.target.value)}
                className={INPUT_CLASS}
                rows={3}
                placeholder="Conteudo da clausula..."
              />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={onAddClausula}>
            <Plus size={14} className="mr-1" /> Adicionar clausula
          </Button>
        </>
      )}
    </div>
  )
}
