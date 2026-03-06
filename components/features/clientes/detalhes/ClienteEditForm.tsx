'use client'

import { ChangeEvent, FormEvent } from 'react'
import { Edit2, Plus, Save, Trash2 } from '@/lib/icons'
import { Button } from '@/components/common'
import type { ClienteFormData } from './types'
import { INPUT_CLASS, LABEL_CLASS } from './utils'

export interface ClienteEditFormProps {
  formData: ClienteFormData
  saving: boolean
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onCustomFieldChange: (index: number, field: 'label' | 'value', value: string) => void
  onAddCustomField: () => void
  onRemoveCustomField: (index: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ClienteEditForm({
  formData,
  saving,
  onChange,
  onCustomFieldChange,
  onAddCustomField,
  onRemoveCustomField,
  onSubmit,
  onCancel,
}: ClienteEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <Edit2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold">Editar Cliente</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Nome *</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={onChange}
            className={INPUT_CLASS}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Telefone</label>
          <input
            type="text"
            name="telefone"
            value={formData.telefone}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Empresa</label>
          <input
            type="text"
            name="empresa"
            value={formData.empresa}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
        <div className="col-span-2">
          <label className={LABEL_CLASS}>Endereço</label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Cidade</label>
          <input
            type="text"
            name="cidade"
            value={formData.cidade}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Estado</label>
          <input
            type="text"
            name="estado"
            value={formData.estado}
            onChange={onChange}
            className={INPUT_CLASS}
            maxLength={2}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>CEP</label>
          <input
            type="text"
            name="cep"
            value={formData.cep}
            onChange={onChange}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Mais informações</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Cargo</label>
            <input
              type="text"
              name="cargo"
              value={formData.cargo}
              onChange={onChange}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Documento</label>
            <input
              type="text"
              name="documento"
              value={formData.documento}
              onChange={onChange}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={onChange}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Data nascimento</label>
            <input
              type="date"
              name="dataNascimento"
              value={formData.dataNascimento}
              onChange={onChange}
              className={INPUT_CLASS}
            />
          </div>
          <div className="col-span-2">
            <label className={LABEL_CLASS}>Observações</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={onChange}
              className={INPUT_CLASS}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Campos personalizados</h3>
        <div className="space-y-3">
          {formData.camposPersonalizados.map((campo, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Label"
                value={campo.label}
                onChange={(e) => onCustomFieldChange(index, 'label', e.target.value)}
                className={`${INPUT_CLASS} flex-1`}
              />
              <input
                type="text"
                placeholder="Valor"
                value={campo.value}
                onChange={(e) => onCustomFieldChange(index, 'value', e.target.value)}
                className={`${INPUT_CLASS} flex-1`}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onRemoveCustomField(index)}
                className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={onAddCustomField}>
            <Plus className="h-4 w-4 mr-2" />
            Novo campo
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
