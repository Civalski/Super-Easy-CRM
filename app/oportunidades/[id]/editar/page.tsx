'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/common'
import { AmbienteSelector } from '@/components/features/oportunidades'
import { useMotivosPerda } from '@/lib/hooks/useMotivosPerda'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

interface Cliente {
  id: string
  nome: string
}

const formatDateInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function EditarOportunidadePage() {
  const router = useRouter()
  const params = useParams()
  const oportunidadeId = typeof params.id === 'string' ? params.id : params.id?.[0]

  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
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
    if (!oportunidadeId) return

    const carregarDados = async () => {
      setCarregando(true)
      try {
        const [oportunidadeResponse, clientesResponse] = await Promise.all([
          fetch(`/api/oportunidades/${oportunidadeId}`),
          fetch('/api/clientes'),
        ])

        if (!oportunidadeResponse.ok) {
          const error = await oportunidadeResponse.json().catch(() => null)
          alert(error?.error || 'Erro ao carregar oportunidade')
          router.push('/oportunidades')
          return
        }

        const oportunidade = await oportunidadeResponse.json()
        const clientesData = clientesResponse.ok ? await clientesResponse.json() : []

        setFormData({
          titulo: oportunidade.titulo || '',
          descricao: oportunidade.descricao || '',
          valor: oportunidade.valor ? String(oportunidade.valor) : '',
          status: oportunidade.status || 'prospeccao',
          probabilidade:
            typeof oportunidade.probabilidade === 'number'
              ? String(oportunidade.probabilidade)
              : '0',
          dataFechamento: formatDateInput(oportunidade.dataFechamento),
          motivoPerda: oportunidade.motivoPerda || '',
          clienteId: oportunidade.clienteId || '',
          ambienteId: oportunidade.ambienteId || '',
        })

        if (Array.isArray(clientesData)) {
          setClientes(clientesData)
        } else {
          console.error('API de clientes retornou dados em formato inesperado:', clientesData)
          setClientes([])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        alert('Erro ao carregar oportunidade. Tente novamente.')
        router.push('/oportunidades')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [oportunidadeId, router])

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
    if (!oportunidadeId) return

    if (!formData.ambienteId || formData.ambienteId.trim() === '') {
      alert('Por favor, selecione um ambiente')
      return
    }

    if (!formData.clienteId || formData.clienteId.trim() === '') {
      alert('Por favor, selecione um cliente')
      return
    }

    if (formData.status === 'perdida' && (!formData.motivoPerda || formData.motivoPerda.trim() === '')) {
      alert('Informe o motivo da perda')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/oportunidades/${oportunidadeId}`, {
        method: 'PATCH',
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
        alert(error.error || 'Erro ao atualizar oportunidade')
      }
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error)
      alert('Erro ao atualizar oportunidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando oportunidade...</p>
        </div>
      </div>
    )
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
          Editar Oportunidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da oportunidade
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
                Titulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titulo da oportunidade"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descricao
              </label>
              <textarea
                id="descricao"
                name="descricao"
                rows={4}
                value={formData.descricao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descricao detalhada da oportunidade"
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
                <option value="prospeccao">Prospeccao</option>
                <option value="qualificacao">Qualificacao</option>
                <option value="proposta">Proposta</option>
                <option value="negociacao">Negociacao</option>
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
                  Salvar Alteracoes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
