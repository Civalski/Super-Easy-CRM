'use client'

import type { ChangeEvent } from 'react'
import { Building2, FileText, Mail, MapPin, Phone, Plus, Trash2 } from '@/lib/icons'
import { useTipoPublico } from '@/lib/hooks/useTipoPublico'
import { formatDate } from '@/lib/format'
import type { Cliente, CampoPersonalizado, ClienteFormData } from './types'
import { EditField, INPUT_CLASS, TEXTAREA_CLASS, ViewGridItem, ViewInfoBlock } from './InfoFieldBlocks'

interface ClienteInfoCardsProps {
  cliente: Cliente
  editMode?: boolean
  formData?: ClienteFormData
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onCustomFieldChange?: (index: number, field: keyof CampoPersonalizado, value: string) => void
  onAddCustomField?: () => void
  onRemoveCustomField?: (index: number) => void
}

export function ClienteInfoCards({
  cliente,
  editMode = false,
  formData,
  onChange,
  onCustomFieldChange,
  onAddCustomField,
  onRemoveCustomField,
}: ClienteInfoCardsProps) {
  const { tipoPublico } = useTipoPublico()
  const isEditing = editMode && Boolean(formData) && Boolean(onChange)
  const inputChangeHandler = onChange as ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined
  const source = formData ?? {
    nome: cliente.nome || '',
    email: cliente.email || '',
    telefone: cliente.telefone || '',
    empresa: cliente.empresa || '',
    endereco: cliente.endereco || '',
    cidade: cliente.cidade || '',
    estado: cliente.estado || '',
    cep: cliente.cep || '',
    cargo: cliente.cargo || '',
    documento: cliente.documento || '',
    website: cliente.website || '',
    dataNascimento: cliente.dataNascimento || '',
    observacoes: cliente.observacoes || '',
    camposPersonalizados: cliente.camposPersonalizados || [],
  }

  return (
    <div className="space-y-3">
      <section className="crm-card overflow-hidden border border-gray-200/70 p-3.5 md:p-4 dark:border-gray-700">
        <div className="space-y-2.5">
          <div className="min-w-0">
            {isEditing ? (
              <input
                name="nome"
                value={source.nome}
                onChange={(event) => inputChangeHandler?.(event)}
                className={`${INPUT_CLASS} text-base font-semibold`}
              />
            ) : (
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">{cliente.nome}</h2>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Criado em {formatDate(cliente.createdAt)} | Atualizado em {formatDate(cliente.updatedAt)}
            </p>
          </div>

          {isEditing ? (
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Numero</span>
                <input
                  readOnly
                  value={cliente.numero != null ? String(cliente.numero) : '-'}
                  className={`${INPUT_CLASS} mt-1 cursor-not-allowed opacity-80`}
                />
              </label>
              <EditField
                label="Email"
                name="email"
                value={source.email}
                onChange={(event) => inputChangeHandler?.(event)}
                type="email"
              />
              <EditField
                label="Telefone"
                name="telefone"
                value={source.telefone}
                onChange={(event) => inputChangeHandler?.(event)}
              />
              <EditField
                label="Empresa"
                name="empresa"
                value={source.empresa}
                onChange={(event) => inputChangeHandler?.(event)}
              />
            </div>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              <ViewGridItem label="Numero" value={cliente.numero != null ? String(cliente.numero) : '-'} />
              <ViewInfoBlock icon={Mail} label="Email" value={cliente.email} />
              <ViewInfoBlock icon={Phone} label="Telefone" value={cliente.telefone} />
              <ViewInfoBlock icon={Building2} label="Empresa" value={cliente.empresa} />
            </div>
          )}
        </div>
      </section>

      <section className="crm-card border border-gray-200/70 p-3.5 md:p-4 dark:border-gray-700">
        <div className="grid gap-3 xl:grid-cols-2">
          <div>
            <h3 className="mb-2.5 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">
              <MapPin className="h-4 w-4" />
              Endereco
            </h3>
            {isEditing ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                <EditField label="Endereco" name="endereco" value={source.endereco} onChange={(event) => inputChangeHandler?.(event)} />
                <EditField label="Cidade" name="cidade" value={source.cidade} onChange={(event) => inputChangeHandler?.(event)} />
                <EditField label="Estado" name="estado" value={source.estado} onChange={(event) => inputChangeHandler?.(event)} />
                <EditField label="CEP" name="cep" value={source.cep} onChange={(event) => inputChangeHandler?.(event)} />
              </div>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                <ViewGridItem label="Endereco" value={cliente.endereco} />
                <ViewGridItem label="Cidade" value={cliente.cidade} />
                <ViewGridItem label="Estado" value={cliente.estado ? cliente.estado.toUpperCase() : null} />
                <ViewGridItem label="CEP" value={cliente.cep} />
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2.5 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:border-gray-700 dark:text-gray-300">
              <FileText className="h-4 w-4" />
              Mais informacoes
            </h3>
            {(() => {
              if (tipoPublico === 'B2C') return null
              const hasB2B =
                cliente.cnpj || cliente.razaoSocial || cliente.nomeFantasia || cliente.capitalSocial ||
                cliente.porte || cliente.naturezaJuridica || cliente.situacaoCadastral || cliente.dataAbertura ||
                cliente.matrizFilial || cliente.cnaePrincipal || cliente.cnaePrincipalDesc || cliente.logradouro ||
                cliente.numeroEndereco || cliente.bairro || cliente.telefone2 || cliente.fax
              if (!hasB2B) return null
              return (
                <div className="mt-3 rounded-lg border border-gray-200/80 bg-gray-50/40 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                  <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Dados da empresa (B2B)</p>
                  <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                    {cliente.cnpj && <ViewGridItem label="CNPJ" value={cliente.cnpj} />}
                    {cliente.razaoSocial && <ViewGridItem label="Razao social" value={cliente.razaoSocial} />}
                    {cliente.nomeFantasia && <ViewGridItem label="Nome fantasia" value={cliente.nomeFantasia} />}
                    {cliente.matrizFilial && <ViewGridItem label="Matriz/Filial" value={cliente.matrizFilial} />}
                    {cliente.capitalSocial && <ViewGridItem label="Capital social" value={cliente.capitalSocial} />}
                    {cliente.porte && <ViewGridItem label="Porte" value={cliente.porte} />}
                    {cliente.naturezaJuridica && <ViewGridItem label="Natureza juridica" value={cliente.naturezaJuridica} />}
                    {cliente.situacaoCadastral && <ViewGridItem label="Situacao cadastral" value={cliente.situacaoCadastral} />}
                    {cliente.dataAbertura && <ViewGridItem label="Data abertura" value={cliente.dataAbertura} />}
                    {cliente.cnaePrincipal && <ViewGridItem label="CNAE principal" value={cliente.cnaePrincipal} />}
                    {cliente.cnaePrincipalDesc && <ViewGridItem label="Atividade principal" value={cliente.cnaePrincipalDesc} />}
                    {cliente.logradouro && <ViewGridItem label="Logradouro" value={cliente.logradouro} />}
                    {cliente.numeroEndereco && <ViewGridItem label="Numero" value={cliente.numeroEndereco} />}
                    {cliente.bairro && <ViewGridItem label="Bairro" value={cliente.bairro} />}
                    {cliente.telefone2 && <ViewGridItem label="Telefone 2" value={cliente.telefone2} />}
                    {cliente.fax && <ViewGridItem label="Fax" value={cliente.fax} />}
                  </div>
                </div>
              )
            })()}
            {isEditing ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                <EditField label="Cargo" name="cargo" value={source.cargo} onChange={(event) => inputChangeHandler?.(event)} />
                <EditField label="Documento" name="documento" value={source.documento} onChange={(event) => inputChangeHandler?.(event)} />
                <EditField label="Website" name="website" value={source.website} onChange={(event) => inputChangeHandler?.(event)} type="url" />
                <EditField label="Data nascimento" name="dataNascimento" value={source.dataNascimento} onChange={(event) => inputChangeHandler?.(event)} type="date" />
              </div>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                <ViewGridItem label="Cargo" value={cliente.cargo} />
                <ViewGridItem label="Documento" value={cliente.documento} />
                <ViewGridItem label="Website" value={cliente.website} />
                <ViewGridItem label="Data nascimento" value={cliente.dataNascimento ? formatDate(cliente.dataNascimento) : null} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200/80 bg-gray-50/40 p-3 dark:border-gray-700 dark:bg-gray-900/30">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Observacoes</p>
            {isEditing ? (
              <textarea
                name="observacoes"
                value={source.observacoes}
                onChange={(event) => inputChangeHandler?.(event)}
                className={`${TEXTAREA_CLASS} mt-1`}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{cliente.observacoes || '-'}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200/80 bg-gray-50/40 p-3 dark:border-gray-700 dark:bg-gray-900/30">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Campos personalizados</p>
              {isEditing ? (
                <button
                  type="button"
                  onClick={onAddCustomField}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo campo
                </button>
              ) : null}
            </div>

            {isEditing ? (
              source.camposPersonalizados.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum campo personalizado cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {source.camposPersonalizados.map((cp, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="text"
                        value={cp.label}
                        placeholder="Label"
                        onChange={(event) => onCustomFieldChange?.(index, 'label', event.target.value)}
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        value={cp.value}
                        placeholder="Valor"
                        onChange={(event) => onCustomFieldChange?.(index, 'value', event.target.value)}
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveCustomField?.(index)}
                        className="inline-flex items-center justify-center rounded-md border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                        aria-label="Remover campo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : cliente.camposPersonalizados && cliente.camposPersonalizados.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {cliente.camposPersonalizados.map((cp, index) => (
                  <ViewGridItem key={index} label={cp.label} value={cp.value} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum campo personalizado cadastrado.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
