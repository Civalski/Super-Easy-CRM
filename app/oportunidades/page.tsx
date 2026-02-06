'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, AsyncSelect } from '@/components/common'
import { AsyncSelectOption } from '@/components/common/AsyncSelect'
import { useMotivosPerda } from '@/lib/hooks/useMotivosPerda'
import { Save } from 'lucide-react'

export default function PropostasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // AsyncSelect state
  const [selectedPerson, setSelectedPerson] = useState<AsyncSelectOption | null>(null)

  const { motivos, addMotivo, loading: motivosLoading, canAddCustom, customCount, maxCustom } =
    useMotivosPerda()
  const [novoMotivo, setNovoMotivo] = useState('')

  const initialFormData = {
    titulo: '',
    descricao: '',
    valor: '',
    status: 'proposta',
    probabilidade: '0',
    dataFechamento: '',
    motivoPerda: '',
    clienteId: '',
  }

  const [formData, setFormData] = useState(initialFormData)

  // Removed useEffect for fetching clientes since AsyncSelect handles it

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === 'status' && e.target.value !== 'perdida') {
      setFormData((prev) => ({
        ...prev,
        status: e.target.value,
        motivoPerda: '',
      }))
      return
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddMotivo = async () => {
    const trimmed = novoMotivo.trim()
    if (!trimmed) return
    const result = await addMotivo(trimmed)
    if (!result.ok) {
      alert(result.error || 'Nao foi possivel adicionar o motivo')
      return
    }
    setFormData((prev) => ({ ...prev, motivoPerda: result.motivo || trimmed }))
    setNovoMotivo('')
  }

  const motivosDisponiveis = useMemo(() => {
    if (!formData.motivoPerda) return motivos
    const exists = motivos.some(
      (motivo) => motivo.toLowerCase() === formData.motivoPerda.toLowerCase()
    )
    return exists ? motivos : [formData.motivoPerda, ...motivos]
  }, [motivos, formData.motivoPerda])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPerson) {
      alert('Por favor, selecione um cliente ou lead')
      return
    }

    if (formData.status === 'perdida' && (!formData.motivoPerda || formData.motivoPerda.trim() === '')) {
      alert('Informe o motivo da perda')
      return
    }

    setLoading(true)

    try {
      let finalClienteId = selectedPerson.tipo === 'cliente' ? selectedPerson.id : null

      // Se for prospecto, converte primeiro
      if (selectedPerson.tipo === 'prospecto') {
        const convRes = await fetch(`/api/prospectos/${selectedPerson.id}/converter`, {
          method: 'POST',
        })
        const convData = await convRes.json()

        if (!convRes.ok) {
          // Se o erro for que já foi convertido, tentamos usar o ID retornado
          if (convRes.status === 409 && convData.clienteId) {
            finalClienteId = convData.clienteId
          } else {
            throw new Error(convData.error || 'Erro ao converter lead em cliente')
          }
        } else {
          finalClienteId = convData.cliente.id
        }
      }

      if (!finalClienteId) {
        throw new Error('Não foi possível identificar o cliente')
      }

      const response = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          probabilidade: parseInt(formData.probabilidade) || 0,
          clienteId: finalClienteId,
          dataFechamento: formData.dataFechamento || null,
          motivoPerda: formData.motivoPerda || null,
        }),
      })

      if (response.ok) {
        alert('Proposta criada com sucesso!')
        setFormData(initialFormData)
        setSelectedPerson(null) // Reset selection
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar proposta')
      }
    } catch (error: any) {
      console.error('Erro ao criar proposta:', error)
      alert(error.message || 'Erro ao criar proposta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Nova Proposta
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova proposta
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label
                htmlFor="titulo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título da proposta"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                rows={4}
                value={formData.descricao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada da proposta"
              />
            </div>

            <div className="md:col-span-2">
              <AsyncSelect
                label="Cliente / Lead"
                placeholder="Busque por nome, email ou empresa..."
                value={selectedPerson ? selectedPerson.id : ''}
                initialLabel={selectedPerson ? selectedPerson.nome : ''}
                onChange={setSelectedPerson}
                fetchUrl="/api/pessoas/busca"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Busca em Clientes e Leads (Prospectos). Leads serão convertidos automaticamente.
              </p>
            </div>

            <div className="md:col-span-1">
              <label
                htmlFor="valor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Valor (R$)
              </label>
              <input
                type="number"
                id="valor"
                name="valor"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {formData.status === 'perdida' && (
              <div className="md:col-span-2">
                <label
                  htmlFor="motivoPerda"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Motivo da Perda <span className="text-red-500">*</span>
                </label>
                <select
                  id="motivoPerda"
                  name="motivoPerda"
                  value={formData.motivoPerda}
                  onChange={handleChange}
                  disabled={motivosLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{motivosLoading ? 'Carregando...' : 'Selecione um motivo'}</option>
                  {motivosDisponiveis.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={novoMotivo}
                    onChange={(event) => setNovoMotivo(event.target.value)}
                    placeholder="Nova categoria de motivo"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMotivo}
                    disabled={!novoMotivo.trim() || !canAddCustom}
                  >
                    Adicionar
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {canAddCustom
                    ? `Voce pode adicionar mais ${Math.max(0, maxCustom - customCount)} motivo(s).`
                    : 'Limite de 3 motivos personalizados atingido.'}
                </p>
              </div>
            )}

            <div className="md:col-span-1">
              <label
                htmlFor="probabilidade"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Probabilidade (%)
              </label>
              <input
                type="number"
                id="probabilidade"
                name="probabilidade"
                min="0"
                max="100"
                value={formData.probabilidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-1">
              <label
                htmlFor="dataFechamento"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Data de Fechamento Prevista
              </label>
              <input
                type="date"
                id="dataFechamento"
                name="dataFechamento"
                value={formData.dataFechamento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Salvar Proposta
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
