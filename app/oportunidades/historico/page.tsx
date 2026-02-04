'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AmbienteSelector, OportunidadeHistoricoCard } from '@/components/features/oportunidades'
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

const HISTORICO_PAGE_SIZE = 10

export default function HistoricoOportunidadesPage() {
  const searchParams = useSearchParams()
  const ambienteInicial = searchParams.get('ambienteId')
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(
    ambienteInicial
  )
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(false)
  const [pageVendas, setPageVendas] = useState(1)
  const [pagePerdidas, setPagePerdidas] = useState(1)

  useEffect(() => {
    setPageVendas(1)
    setPagePerdidas(1)
  }, [ambienteSelecionado])

  const fetchOportunidades = useCallback(async () => {
    if (!ambienteSelecionado) return

    try {
      setLoading(true)
      const url = `/api/oportunidades?ambienteId=${ambienteSelecionado}`
      const response = await fetch(url)
      const data = await response.json()

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
      setOportunidades([])
    }
  }, [ambienteSelecionado, fetchOportunidades])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const handleReturnToPipeline = (id: string, previousStatus: string) => {
    if (!previousStatus) return
    handleStatusChange(id, previousStatus)
  }

  const getOportunidadeTimestamp = (opp: Oportunidade) => {
    const rawDate = opp.dataFechamento || opp.updatedAt || opp.createdAt || ''
    const date = rawDate ? new Date(rawDate) : null
    if (!date || Number.isNaN(date.getTime())) return 0
    return date.getTime()
  }

  const historicoVendasOrdenado = oportunidades
    .filter((opp) => opp.status === 'fechada')
    .sort((a, b) => getOportunidadeTimestamp(b) - getOportunidadeTimestamp(a))

  const historicoPerdidasOrdenado = oportunidades
    .filter((opp) => opp.status === 'perdida')
    .sort((a, b) => getOportunidadeTimestamp(b) - getOportunidadeTimestamp(a))

  const vendasTotalPages = Math.max(
    1,
    Math.ceil(historicoVendasOrdenado.length / HISTORICO_PAGE_SIZE)
  )
  const perdidasTotalPages = Math.max(
    1,
    Math.ceil(historicoPerdidasOrdenado.length / HISTORICO_PAGE_SIZE)
  )

  useEffect(() => {
    if (pageVendas > vendasTotalPages) {
      setPageVendas(vendasTotalPages)
    }
  }, [pageVendas, vendasTotalPages])

  useEffect(() => {
    if (pagePerdidas > perdidasTotalPages) {
      setPagePerdidas(perdidasTotalPages)
    }
  }, [pagePerdidas, perdidasTotalPages])

  const vendasPageItems = historicoVendasOrdenado.slice(
    (pageVendas - 1) * HISTORICO_PAGE_SIZE,
    pageVendas * HISTORICO_PAGE_SIZE
  )
  const perdidasPageItems = historicoPerdidasOrdenado.slice(
    (pagePerdidas - 1) * HISTORICO_PAGE_SIZE,
    pagePerdidas * HISTORICO_PAGE_SIZE
  )

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/oportunidades"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3"
        >
          Voltar ao pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historico de Oportunidades
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Consulte vendas e perdas anteriores com paginacao.
        </p>
        <div className="mt-4">
          <AmbienteSelector
            ambienteSelecionado={ambienteSelecionado}
            onAmbienteChange={setAmbienteSelecionado}
          />
        </div>
      </div>

      {!ambienteSelecionado ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-gray-600 dark:text-gray-400">
            Selecione um ambiente para visualizar o historico.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-600 dark:text-gray-400">Carregando historico...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section
            id="vendas"
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historico de Vendas
                </h2>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {historicoVendasOrdenado.length}
              </span>
            </div>
            {historicoVendasOrdenado.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhuma venda registrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {vendasPageItems.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {historicoVendasOrdenado.length > HISTORICO_PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageVendas <= 1}
                  onClick={() => setPageVendas((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pagina {pageVendas} de {vendasTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageVendas >= vendasTotalPages}
                  onClick={() =>
                    setPageVendas((prev) => Math.min(vendasTotalPages, prev + 1))
                  }
                >
                  Proxima
                </Button>
              </div>
            )}
          </section>

          <section
            id="perdidas"
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <XCircle className="text-red-600 dark:text-red-400" size={18} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historico de Perdidas
                </h2>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {historicoPerdidasOrdenado.length}
              </span>
            </div>
            {historicoPerdidasOrdenado.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhuma oportunidade perdida registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {perdidasPageItems.map((oportunidade) => (
                  <OportunidadeHistoricoCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                    onReturnToPipeline={handleReturnToPipeline}
                  />
                ))}
              </div>
            )}
            {historicoPerdidasOrdenado.length > HISTORICO_PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagePerdidas <= 1}
                  onClick={() => setPagePerdidas((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pagina {pagePerdidas} de {perdidasTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagePerdidas >= perdidasTotalPages}
                  onClick={() =>
                    setPagePerdidas((prev) => Math.min(perdidasTotalPages, prev + 1))
                  }
                >
                  Proxima
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
