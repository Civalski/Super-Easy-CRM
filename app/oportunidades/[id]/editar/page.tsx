'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/common'
import { useMotivosPerda } from '@/lib/hooks/useMotivosPerda'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Swal from 'sweetalert2'

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
    status: 'orcamento',
    probabilidade: '0',
    dataFechamento: '',
    motivoPerda: '',
    clienteId: '',
    proximaAcaoEm: '',
    canalProximaAcao: '',
    responsavelProximaAcao: '',
    lembreteProximaAcao: false,
  })

  useEffect(() => {
    if (!oportunidadeId) return

    const carregarDados = async () => {
      setCarregando(true)
      try {
        const [oportunidadeResponse, clientesResponse] = await Promise.all([
          fetch(`/api/oportunidades/${oportunidadeId}`),
          fetch('/api/clientes?mode=options&limit=50'),
        ])

        if (!oportunidadeResponse.ok) {
          const error = await oportunidadeResponse.json().catch(() => null)
          Swal.fire({ icon: 'error', title: 'Erro', text: error?.error || 'Erro ao carregar orçamento', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
          router.push('/oportunidades')
          return
        }

        const oportunidade = await oportunidadeResponse.json()
        const clientesData = clientesResponse.ok ? await clientesResponse.json() : []

        setFormData({
          titulo: oportunidade.titulo || '',
          descricao: oportunidade.descricao || '',
          valor: oportunidade.valor ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(oportunidade.valor) : '',
          status: oportunidade.status || 'orcamento',
          probabilidade:
            typeof oportunidade.probabilidade === 'number'
              ? String(oportunidade.probabilidade)
              : '0',
          dataFechamento: formatDateInput(oportunidade.dataFechamento),
          motivoPerda: oportunidade.motivoPerda || '',
          clienteId: oportunidade.clienteId || '',
          proximaAcaoEm: formatDateInput(oportunidade.proximaAcaoEm),
          canalProximaAcao: oportunidade.canalProximaAcao || '',
          responsavelProximaAcao: oportunidade.responsavelProximaAcao || '',
          lembreteProximaAcao: oportunidade.lembreteProximaAcao === true,
        })

        if (Array.isArray(clientesData)) {
          setClientes(clientesData)
        } else {
          console.error('API de clientes retornou dados em formato inesperado:', clientesData)
          setClientes([])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao carregar orçamento. Tente novamente.', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
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
    if (e.target.name === 'lembreteProximaAcao') {
      const target = e.target as HTMLInputElement
      setFormData((prev) => ({
        ...prev,
        lembreteProximaAcao: target.checked,
      }))
      return
    }

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

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setFormData({ ...formData, valor: '' })
      return
    }
    const numericValue = parseInt(rawValue, 10) / 100
    const formatted = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(numericValue)
    setFormData({ ...formData, valor: formatted })
  }

  const handleAddMotivo = async () => {
    const trimmed = novoMotivo.trim()
    if (!trimmed) return
    const result = await addMotivo(trimmed)
    if (!result.ok) {
      Swal.fire({ icon: 'error', title: 'Erro', text: result.error || 'Não foi possível adicionar o motivo', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
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
    if (!oportunidadeId) return


    if (!formData.clienteId || formData.clienteId.trim() === '') {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Por favor, selecione um cliente', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      return
    }

    if (formData.status === 'perdida' && (!formData.motivoPerda || formData.motivoPerda.trim() === '')) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Informe o motivo da perda', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
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
          valor: formData.valor ? parseFloat(formData.valor.replace(/\./g, '').replace(',', '.')) : null,
          probabilidade: parseInt(formData.probabilidade) || 0,
          clienteId: formData.clienteId || null,
          dataFechamento: formData.dataFechamento || null,
          motivoPerda: formData.motivoPerda || null,
          proximaAcaoEm: formData.proximaAcaoEm || null,
          canalProximaAcao: formData.canalProximaAcao || null,
          responsavelProximaAcao: formData.responsavelProximaAcao || null,
          lembreteProximaAcao: formData.lembreteProximaAcao,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.statusAutoAtualizado) {
          await Swal.fire({ icon: 'success', title: 'Orçamento salvo!', text: 'O status foi ajustado automaticamente para "Orçamento".', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
        } else if (formData.status === 'fechada' && result.prospectoConvertidoAutomaticamente) {
          await Swal.fire({
            icon: 'success',
            title: 'Venda Fechada! 🎉',
            html: 'O orçamento foi fechado com sucesso.<br><br><strong>Lead convertido em cliente!</strong> O lead vinculado foi automaticamente promovido a cliente.',
            confirmButtonColor: '#16a34a',
            background: '#1f2937',
            color: '#f3f4f6',
          })
        }
        router.push('/oportunidades')
      } else {
        const error = await response.json()
        Swal.fire({ icon: 'error', title: 'Erro', text: error.error || 'Erro ao atualizar orçamento', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
      }
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao atualizar orçamento. Tente novamente.', confirmButtonColor: '#6366f1', background: '#1f2937', color: '#f3f4f6' })
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando orçamento...</p>
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
          Voltar para Orçamentos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Editar Orçamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do orçamento
        </p>
      </div>

      <div className="crm-card p-6">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Título do orçamento"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada do orçamento"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                htmlFor="valor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Valor (R$)
              </label>
              <input
                type="text"
                id="valor"
                name="valor"
                value={formData.valor}
                onChange={handleCurrencyChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>

            {/* Status selection removed */}

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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:scheme-dark"
              />
            </div>

            <div>
              <label
                htmlFor="proximaAcaoEm"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Proxima Acao
              </label>
              <input
                type="date"
                id="proximaAcaoEm"
                name="proximaAcaoEm"
                value={formData.proximaAcaoEm}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:scheme-dark"
              />
            </div>

            <div>
              <label
                htmlFor="canalProximaAcao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Canal da Proxima Acao
              </label>
              <select
                id="canalProximaAcao"
                name="canalProximaAcao"
                value={formData.canalProximaAcao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="ligacao">Ligacao</option>
                <option value="reuniao">Reuniao</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="responsavelProximaAcao"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Responsavel pela Proxima Acao
              </label>
              <input
                type="text"
                id="responsavelProximaAcao"
                name="responsavelProximaAcao"
                value={formData.responsavelProximaAcao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Joao"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="lembreteProximaAcao"
              checked={formData.lembreteProximaAcao}
              onChange={handleChange}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
            />
            Ativar lembrete da proxima acao
          </label>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {oportunidadeId && (
              <Link href={`/oportunidades/${oportunidadeId}/followups`}>
                <Button type="button" variant="outline" disabled={loading}>
                  Follow-ups
                </Button>
              </Link>
            )}
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
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

