'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { KanbanBoard, AmbienteSelector, OportunidadesHeader } from '@/components/features/oportunidades'
import { Button } from '@/components/common'

import { Plus, Loader2 } from 'lucide-react'

interface Oportunidade {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  status: string
  probabilidade: number
  cliente: {
    nome: string
  }
}

export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(false)
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(null)

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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/oportunidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setOportunidades((prev) =>
          prev.map((opp) => (opp.id === id ? { ...opp, status: newStatus } : opp))
        )
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

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
          <KanbanBoard
            oportunidades={oportunidades}
            onStatusChange={handleStatusChange}
          />
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
    </div>
  )
}

