'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Bell } from 'lucide-react'
import { Button } from '@/components/common'

interface Cliente {
  id: string
  nome: string
}

interface Oportunidade {
  id: string
  titulo: string
}

const formatDateInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function EditarTarefaPage() {
  const router = useRouter()
  const params = useParams()
  const tarefaId = typeof params.id === 'string' ? params.id : params.id?.[0]

  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente',
    prioridade: 'media',
    dataVencimento: '',
    clienteId: '',
    oportunidadeId: '',
    notificar: false,
  })

  useEffect(() => {
    if (!tarefaId) return

    const carregarDados = async () => {
      setCarregando(true)
      try {
        const [tarefaResponse, clientesResponse, oportunidadesResponse] = await Promise.all([
          fetch(`/api/tarefas/${tarefaId}`),
          fetch('/api/clientes'),
          fetch('/api/oportunidades'),
        ])

        if (!tarefaResponse.ok) {
          const error = await tarefaResponse.json().catch(() => null)
          alert(error?.error || 'Erro ao carregar tarefa')
          router.push('/tarefas')
          return
        }

        const tarefaData = await tarefaResponse.json()
        const clientesData = clientesResponse.ok ? await clientesResponse.json() : []
        const oportunidadesData = oportunidadesResponse.ok ? await oportunidadesResponse.json() : []

        setFormData({
          titulo: tarefaData.titulo || '',
          descricao: tarefaData.descricao || '',
          status: tarefaData.status || 'pendente',
          prioridade: tarefaData.prioridade || 'media',
          dataVencimento: formatDateInput(tarefaData.dataVencimento),
          clienteId: tarefaData.clienteId || '',
          oportunidadeId: tarefaData.oportunidadeId || '',
          notificar: tarefaData.notificar ?? false,
        })

        if (Array.isArray(clientesData)) {
          setClientes(clientesData)
        } else {
          console.error('API de clientes retornou dados em formato inesperado:', clientesData)
          setClientes([])
        }

        if (Array.isArray(oportunidadesData)) {
          setOportunidades(oportunidadesData)
        } else {
          console.error('API de oportunidades retornou dados em formato inesperado:', oportunidadesData)
          setOportunidades([])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        alert('Erro ao carregar tarefa. Tente novamente.')
        router.push('/tarefas')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [router, tarefaId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tarefaId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tarefas/${tarefaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clienteId: formData.clienteId || null,
          oportunidadeId: formData.oportunidadeId || null,
          dataVencimento: formData.dataVencimento || null,
        }),
      })

      if (response.ok) {
        router.push('/tarefas')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar tarefa')
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      alert('Erro ao atualizar tarefa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando tarefa...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/tarefas"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Tarefas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Editar Tarefa
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Atualize os dados da tarefa</p>
      </div>

      <div className="crm-card p-6">
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
                placeholder="Titulo da tarefa"
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
                placeholder="Descricao detalhada da tarefa"
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
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluida</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="prioridade"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Prioridade
              </label>
              <select
                id="prioridade"
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dataVencimento"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Data e Hora de Vencimento
              </label>
              <input
                type="datetime-local"
                id="dataVencimento"
                name="dataVencimento"
                value={formData.dataVencimento}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div>
              <label
                htmlFor="clienteId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Cliente (Opcional)
              </label>
              <select
                id="clienteId"
                name="clienteId"
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
                htmlFor="oportunidadeId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Oportunidade (Opcional)
              </label>
              <select
                id="oportunidadeId"
                name="oportunidadeId"
                value={formData.oportunidadeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma oportunidade</option>
                {oportunidades.map((oportunidade) => (
                  <option key={oportunidade.id} value={oportunidade.id}>
                    {oportunidade.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <div
                onClick={() => setFormData({ ...formData, notificar: !formData.notificar })}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${formData.notificar
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.notificar
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className={`font-medium ${formData.notificar ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      Notificação no Navegador
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receba um alerta visual quando a tarefa vencer
                    </p>
                  </div>
                </div>

                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.notificar ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notificar ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/tarefas">
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
