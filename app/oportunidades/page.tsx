'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import {
  KanbanBoard,
  AmbienteSelector,
  OportunidadesHeader,
  OportunidadeHistoricoCard,
  MotivoPerdaModal,
} from '@/components/features/oportunidades'
import { Button } from '@/components/common'

import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface Oportunidade {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  status: string
  statusAnterior?: string | null
  motivoPerda?: string | null
  probabilidade: number
  dataFechamento?: string | null
  createdAt?: string
  updatedAt?: string
  cliente: {
    nome: string
  }
}

export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(false)
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(null)
  const [motivoModalOpen, setMotivoModalOpen] = useState(false)
  const [motivoOportunidadeId, setMotivoOportunidadeId] = useState<string | null>(null)
  const [motivoLoading, setMotivoLoading] = useState(false)

  const HISTORICO_PREVIEW_COUNT = 2

  const oportunidadesAtivas = oportunidades.filter(
    (opp) => opp.status !== 'fechada' && opp.status !== 'perdida'
  )
  const historicoVendas = oportunidades.filter((opp) => opp.status === 'fechada')
  const historicoPerdidas = oportunidades.filter((opp) => opp.status === 'perdida')

  const getOportunidadeTimestamp = (opp: Oportunidade) => {
    const rawDate = opp.dataFechamento || opp.updatedAt || opp.createdAt || ''
    const date = rawDate ? new Date(rawDate) : null
    if (!date || Number.isNaN(date.getTime())) return 0
    return date.getTime()
  }

  const historicoVendasOrdenado = [...historicoVendas].sort(
    (a, b) => getOportunidadeTimestamp(b) - getOportunidadeTimestamp(a)
  )
  const historicoPerdidasOrdenado = [...historicoPerdidas].sort(
    (a, b) => getOportunidadeTimestamp(b) - getOportunidadeTimestamp(a)
  )

  const vendasPreview = historicoVendasOrdenado.slice(0, HISTORICO_PREVIEW_COUNT)
  const perdidasPreview = historicoPerdidasOrdenado.slice(0, HISTORICO_PREVIEW_COUNT)

  const fetchOportunidades = useCallback(async () => {
    if (!ambienteSelecionado) return

    try {
      setLoading(true)
      const url = `/api/oportunidades?ambienteId=${ambienteSelecionado}`
      const response = await fetch(url)
      const data = await response.json()

      // Garantir que data seja sempre um array
      if (Array.isArray(data)) {
        setOportunidades(data)
      } else {
        console.error('API de oportunidades retornou dados em formato inesperado:', data)
        setOportunidades([])
      }
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error)
      setOportunidades([])
    } finally {
      setLoading(false)
    }
  }, [ambienteSelecionado])

  useEffect(() => {
    if (ambienteSelecionado) {
      fetchOportunidades()
    } else {
      // Limpa oportunidades quando nenhum ambiente está selecionado
      setOportunidades([])
    }

    // Recarrega quando a página ganha foco (útil após criar nova oportunidade)
    const handleFocus = () => {
      if (ambienteSelecionado) {
        fetchOportunidades()
      }
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [ambienteSelecionado, fetchOportunidades])

  const updateOportunidade = async (id: string, payload: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const oportunidadeAtualizada = await response.json()
        setOportunidades((prev) =>
          prev.map((opp) => (opp.id === id ? oportunidadeAtualizada : opp))
        )
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'perdida') {
      setMotivoOportunidadeId(id)
      setMotivoModalOpen(true)
      return
    }

    await updateOportunidade(id, { status: newStatus })
  }

  const handleConfirmMotivo = async (motivo: string) => {
    if (!motivoOportunidadeId) return
    setMotivoLoading(true)
    await updateOportunidade(motivoOportunidadeId, {
      status: 'perdida',
      motivoPerda: motivo,
    })
    setMotivoLoading(false)
    setMotivoModalOpen(false)
    setMotivoOportunidadeId(null)
  }

  const handleCancelMotivo = () => {
    if (motivoLoading) return
    setMotivoModalOpen(false)
    setMotivoOportunidadeId(null)
  }
  const handleReturnToPipeline = (id: string, previousStatus: string) => {
    if (!previousStatus) return
    handleStatusChange(id, previousStatus)
  }

  const historicoBaseUrl = ambienteSelecionado
    ? `/oportunidades/historico?ambienteId=${ambienteSelecionado}`
    : '/oportunidades/historico'

  return (
    <div>
      <OportunidadesHeader>
        <AmbienteSelector
          ambienteSelecionado={ambienteSelecionado}
          onAmbienteChange={setAmbienteSelecionado}
        />
      </OportunidadesHeader>

      {ambienteSelecionado ? (
        loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-600 dark:text-gray-400">Carregando oportunidades...</p>
            </div>
          </div>
        ) : (
          <>
            <KanbanBoard
              oportunidades={oportunidadesAtivas}
              onStatusChange={handleStatusChange}
            />

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Historico de Vendas
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {historicoVendasOrdenado.length}
                    </span>
                    {historicoVendasOrdenado.length > 0 && (
                      <Link href={`${historicoBaseUrl}#vendas`}>
                        <Button size="sm" variant="outline">
                          Ver todas
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                {historicoVendasOrdenado.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nenhuma venda registrada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vendasPreview.map((oportunidade) => (
                      <OportunidadeHistoricoCard
                        key={oportunidade.id}
                        oportunidade={oportunidade}
                        onReturnToPipeline={handleReturnToPipeline}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="text-red-600 dark:text-red-400" size={18} />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Historico de Perdidas
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {historicoPerdidasOrdenado.length}
                    </span>
                    {historicoPerdidasOrdenado.length > 0 && (
                      <Link href={`${historicoBaseUrl}#perdidas`}>
                        <Button size="sm" variant="outline">
                          Ver todas
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                {historicoPerdidasOrdenado.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nenhuma oportunidade perdida registrada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {perdidasPreview.map((oportunidade) => (
                      <OportunidadeHistoricoCard
                        key={oportunidade.id}
                        oportunidade={oportunidade}
                        onReturnToPipeline={handleReturnToPipeline}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Selecione um ambiente para visualizar as oportunidades
            </p>
          </div>
        </div>
      )}

      <MotivoPerdaModal
        open={motivoModalOpen}
        onConfirm={handleConfirmMotivo}
        onCancel={handleCancelMotivo}
        loading={motivoLoading}
      />
    </div>
  )
}
