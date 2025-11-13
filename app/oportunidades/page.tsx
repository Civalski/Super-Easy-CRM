'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import KanbanBoard from '@/components/KanbanBoard'
import Button from '@/components/Button'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOportunidades()

    // Recarrega quando a página ganha foco (útil após criar nova oportunidade)
    const handleFocus = () => {
      fetchOportunidades()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchOportunidades = async () => {
    try {
      const response = await fetch('/api/oportunidades')
      const data = await response.json()
      setOportunidades(data)
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Carregando oportunidades...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pipeline de Oportunidades
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seu funil de vendas com drag and drop
          </p>
        </div>
        <Link href="/oportunidades/nova">
          <Button>
            <Plus size={20} className="mr-2" />
            Nova Oportunidade
          </Button>
        </Link>
      </div>

      <KanbanBoard 
        oportunidades={oportunidades} 
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

