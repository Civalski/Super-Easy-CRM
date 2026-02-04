'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common'
import { AmbienteSelector } from '@/components/features/oportunidades'
import { useMotivosPerda } from '@/lib/hooks/useMotivosPerda'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Cliente {
  id: string
  nome: string
}

export default function NovaOportunidadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const { motivos, addMotivo, loading: motivosLoading, canAddCustom, customCount, maxCustom } =
    useMotivosPerda()
  const [novoMotivo, setNovoMotivo] = useState('')
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    status: 'prospeccao',
    probabilidade: '0',
    dataFechamento: '',
    motivoPerda: '',
    clienteId: '',
    ambienteId: '',
  })

  useEffect(() => {
    // Carrega clientes para o select
    fetch('/api/clientes')
      .then((res) => res.json())
      .then((data) => {
        // Garantir que data seja sempre um array
        if (Array.isArray(data)) {
          setClientes(data)
        } else {
          console.error('API de clientes retornou dados em formato inesperado:', data)
          setClientes([])
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar clientes:', error)
        setClientes([])
      })

    // Carrega ambientes e seleciona o primeiro automaticamente
    fetch('/api/ambientes')
      .then((res) => res.json())
      .then((data) => {
        // Garantir que data seja sempre um array
        if (Array.isArray(data) && data.length > 0) {
          // Se houver ambientes, seleciona o primeiro automaticamente
          setFormData((prev) => ({ ...prev, ambienteId: data[0].id }))
        } else if (!Array.isArray(data)) {
          console.error('API de ambientes retornou dados em formato inesperado:', data)
        }
      })
      .catch((error) => console.error('Erro ao carregar ambientes:', error))
  }, [])

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

  const handleAmbienteChange = (ambienteId: string | null) => {
    setFormData({
      ...formData,
      ambienteId: ambienteId || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação de campos obrigatórios
    if (!formData.ambienteId || formData.ambienteId.trim() === '') {
      alert('Por favor, selecione um ambiente')
      return
    }

    if (formData.status === 'perdida' && (!formData.motivoPerda || formData.motivoPerda.trim() === '')) {
      alert('Informe o motivo da perda')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/oportunidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          probabilidade: parseInt(formData.probabilidade) || 0,
          clienteId: formData.clienteId || null,
          ambienteId: formData.ambienteId || null,
          dataFechamento: formData.dataFechamento || null,
          motivoPerda: formData.motivoPerda || null,
        }),
      })

      if (response.ok) {
        router.push('/oportunidades')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar oportunidade')
      }
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error)
      alert('Erro ao criar oportunidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/oportunidades"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Oportunidades
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Nova Oportunidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova oportunidade
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
                placeholder="Título da oportunidade"
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
                placeholder="Descrição detalhada da oportunidade"
              />
            </div>

            <div>
              <label
                htmlFor="clienteId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="clienteId"
                name="clienteId"
                required
                value={formData.clienteId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ambienteId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ambiente <span className="text-red-500">*</span>
              </label>
              <AmbienteSelector
                ambienteSelecionado={formData.ambienteId || null}
                onAmbienteChange={handleAmbienteChange}
              />
            </div>

            <div>
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

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="prospeccao">Prospecção</option>
                <option value="qualificacao">Qualificação</option>
                <option value="proposta">Proposta</option>
                <option value="negociacao">Negociação</option>
                <option value="fechada">Fechada</option>
                <option value="perdida">Perdida</option>
              </select>
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

            <div>
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

            <div>
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/oportunidades">
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
                  Salvar Oportunidade
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
