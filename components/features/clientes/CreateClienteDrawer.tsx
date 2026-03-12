'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect } from 'react'
import { Loader2, Plus, Save, Trash2, X } from '@/lib/icons'
import { SideCreateDrawer } from '@/components/common'
import { useTipoPublico } from '@/lib/hooks/useTipoPublico'
import type { CampoPersonalizado, CreateClienteForm } from './types'

interface CreateClienteDrawerProps {
  open: boolean
  creating: boolean
  form: CreateClienteForm
  mode?: 'create' | 'edit'
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onAddCustomField: () => void
  onCustomFieldChange: (index: number, field: keyof CampoPersonalizado, value: string) => void
  onRemoveCustomField: (index: number) => void
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300'

const mainFields: Array<{ name: keyof CreateClienteForm; label: string; type?: string; required?: boolean; maxLength?: number; placeholder?: string; colSpan?: boolean }> = [
  { name: 'nome', label: 'Nome', required: true, placeholder: 'Nome completo' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'email@exemplo.com' },
  { name: 'telefone', label: 'Telefone', placeholder: '(00) 00000-0000' },
  { name: 'empresa', label: 'Empresa', placeholder: 'Nome da empresa' },
  { name: 'endereco', label: 'Endereco', placeholder: 'Rua, numero', colSpan: true },
  { name: 'cidade', label: 'Cidade', placeholder: 'Cidade' },
  { name: 'estado', label: 'Estado', placeholder: 'SP', maxLength: 2 },
  { name: 'cep', label: 'CEP', placeholder: '00000-000', colSpan: true },
]

const extraFields: Array<{ name: keyof CreateClienteForm; label: string; type?: string; placeholder?: string; colSpan?: boolean }> = [
  { name: 'cargo', label: 'Cargo', placeholder: 'Cargo ou funcao' },
  { name: 'documento', label: 'Documento', placeholder: 'CPF ou CNPJ' },
  { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
  { name: 'dataNascimento', label: 'Data de nascimento', type: 'date' },
]

export function CreateClienteDrawer({
  open,
  creating,
  form,
  mode = 'create',
  onClose,
  onSubmit,
  onInputChange,
  onAddCustomField,
  onCustomFieldChange,
  onRemoveCustomField,
}: CreateClienteDrawerProps) {
  const { tipoPublico } = useTipoPublico()
  const isB2B = form.perfil === 'b2b'
  const isEditMode = mode === 'edit'

  // Fixa o perfil quando o usuário vende apenas B2B ou apenas B2C
  useEffect(() => {
    if (!open) return
    if (tipoPublico === 'B2B' && form.perfil !== 'b2b') {
      onInputChange({ target: { name: 'perfil', value: 'b2b' } } as ChangeEvent<HTMLInputElement>)
    } else if (tipoPublico === 'B2C' && form.perfil !== 'b2c') {
      onInputChange({ target: { name: 'perfil', value: 'b2c' } } as ChangeEvent<HTMLInputElement>)
    }
  }, [open, tipoPublico, form.perfil, onInputChange])

  const showPerfilChoice = tipoPublico === 'ambos'

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEditMode ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <div>
            <label className={LABEL_CLASS}>Tipo de cliente</label>
            {showPerfilChoice ? (
              <div
                role="radiogroup"
                aria-label="Tipo de cliente"
                className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-600 dark:bg-gray-800"
              >
                <label
                  className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    form.perfil === 'b2c'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="perfil"
                    value="b2c"
                    checked={form.perfil === 'b2c'}
                    onChange={onInputChange}
                    className="sr-only"
                  />
                  Cliente final (B2C)
                </label>
                <label
                  className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    form.perfil === 'b2b'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="perfil"
                    value="b2b"
                    checked={form.perfil === 'b2b'}
                    onChange={onInputChange}
                    className="sr-only"
                  />
                  Cliente empresarial (B2B)
                </label>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tipoPublico === 'B2B' ? 'Cliente empresarial (B2B)' : 'Cliente final (B2C)'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mainFields.map((field) => (
              <div key={field.name} className={field.colSpan ? 'md:col-span-2' : ''}>
                <label className={LABEL_CLASS}>
                  {field.name === 'nome' && isB2B ? 'Nome do contato' : field.label}
                  {(field.required && !(field.name === 'nome' && isB2B)) || (field.name === 'empresa' && isB2B) ? (
                    <span className="text-red-500"> *</span>
                  ) : null}
                </label>
                <input
                  type={field.type ?? 'text'}
                  name={field.name}
                  required={field.name === 'nome' ? !isB2B : field.name === 'empresa' ? isB2B : field.required}
                  value={form[field.name] as string}
                  onChange={onInputChange}
                  maxLength={field.maxLength}
                  className={INPUT_CLASS}
                  placeholder={
                    field.name === 'nome' && isB2B
                      ? 'Nome do responsavel'
                      : field.name === 'empresa' && isB2B
                        ? 'Razao social / Nome empresarial'
                        : field.placeholder
                  }
                />
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Mais informacoes</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {extraFields.map((field) => (
                <div key={field.name} className={field.colSpan ? 'md:col-span-2' : ''}>
                  {field.name === 'dataNascimento' && isB2B ? null : (
                    <>
                      <label className={LABEL_CLASS}>
                        {field.name === 'documento' ? (isB2B ? 'CNPJ' : 'CPF') : field.label}
                      </label>
                      <input
                        type={field.type ?? 'text'}
                        name={field.name}
                        value={form[field.name] as string}
                        onChange={onInputChange}
                        className={INPUT_CLASS}
                        placeholder={
                          field.name === 'documento'
                            ? isB2B
                              ? '00.000.000/0000-00'
                              : '000.000.000-00'
                            : field.placeholder
                        }
                      />
                    </>
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Observacoes</label>
                <textarea
                  name="observacoes"
                  value={form.observacoes}
                  onChange={onInputChange}
                  rows={3}
                  className={INPUT_CLASS}
                  placeholder="Informacoes adicionais sobre o cliente"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Campos personalizados</h3>
              <button
                type="button"
                onClick={onAddCustomField}
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Plus size={14} className="mr-1" />
                Novo campo
              </button>
            </div>

            {form.camposPersonalizados.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum campo personalizado adicionado.</p>
            ) : (
              <div className="space-y-3">
                {form.camposPersonalizados.map((campo, index) => (
                  <div key={`drawer-custom-field-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="text"
                      value={campo.label}
                      onChange={(event) => onCustomFieldChange(index, 'label', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Nome do campo"
                    />
                    <input
                      type="text"
                      value={campo.value}
                      onChange={(event) => onCustomFieldChange(index, 'value', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Valor"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveCustomField(index)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                      aria-label="Remover campo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 transition-colors hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-60"
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
              {isEditMode ? 'Salvar alteracoes' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </SideCreateDrawer>
  )
}
