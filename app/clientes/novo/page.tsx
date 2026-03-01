'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

type CampoPersonalizado = {
  label: string
  value: string
}

type ClienteFormData = {
  nome: string
  email: string
  telefone: string
  empresa: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  cargo: string
  documento: string
  website: string
  dataNascimento: string
  observacoes: string
  camposPersonalizados: CampoPersonalizado[]
}

const initialFormData: ClienteFormData = {
  nome: '',
  email: '',
  telefone: '',
  empresa: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  cargo: '',
  documento: '',
  website: '',
  dataNascimento: '',
  observacoes: '',
  camposPersonalizados: [],
}

export default function NovoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCustomFieldChange = (
    index: number,
    field: keyof CampoPersonalizado,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleAddCustomField = () => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { label: '', value: '' }],
    }))
  }

  const handleRemoveCustomField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/clientes')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar cliente')
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      alert('Erro ao criar cliente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/clientes"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Clientes
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Novo Cliente
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados do novo cliente
        </p>
      </div>

      <div className="crm-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label
                htmlFor="empresa"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Empresa
              </label>
              <input
                type="text"
                id="empresa"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da empresa"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="endereco"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Endereco
              </label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Rua, numero"
              />
            </div>

            <div>
              <label
                htmlFor="cidade"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Cidade
              </label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label
                htmlFor="estado"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Estado
              </label>
              <input
                type="text"
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="SP"
              />
            </div>

            <div>
              <label
                htmlFor="cep"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                CEP
              </label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Mais informacoes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Cargo ou funcao"
                />
              </div>

              <div>
                <label htmlFor="documento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento
                </label>
                <input
                  type="text"
                  id="documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="CPF ou CNPJ"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>

              <div>
                <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observacoes
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Informacoes adicionais sobre o cliente"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Campos personalizados
              </h3>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Plus size={14} className="mr-1" />
                Novo campo
              </button>
            </div>

            {formData.camposPersonalizados.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nenhum campo personalizado adicionado.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.camposPersonalizados.map((campo, index) => (
                  <div key={`custom-field-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      type="text"
                      value={campo.label}
                      onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do campo"
                    />
                    <input
                      type="text"
                      value={campo.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Valor"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(index)}
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

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/clientes">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Salvar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
