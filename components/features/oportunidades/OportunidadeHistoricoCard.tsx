'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { formatCurrency } from '@/lib/format'

interface OportunidadeHistorico {
  id: string
  titulo: string
  descricao: string | null
  valor: number | null
  status: string
  statusAnterior?: string | null
  probabilidade: number
  dataFechamento?: string | null
  updatedAt?: string | null
  createdAt?: string | null
  cliente: {
    nome: string
  }
}

interface OportunidadeHistoricoCardProps {
  oportunidade: OportunidadeHistorico
  onReturnToPipeline?: (id: string, previousStatus: string) => void
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  fechada: {
    label: 'Fechada',
    badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  perdida: {
    label: 'Perdida',
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  },
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const STATUS_LABELS: Record<string, string> = {
  sem_contato: 'Sem contato',
  em_potencial: 'Em potencial',
  orcamento: 'Orçamento',
  pedido: 'Pedido',
  fechada: 'Fechada',
  perdida: 'Perdida',
}

export default function OportunidadeHistoricoCard({
  oportunidade,
  onReturnToPipeline,
}: OportunidadeHistoricoCardProps) {
  const statusInfo = STATUS_CONFIG[oportunidade.status] || {
    label: oportunidade.status,
    badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  const registroData =
    oportunidade.dataFechamento || oportunidade.updatedAt || oportunidade.createdAt || null
  const registroLabel =
    oportunidade.status === 'perdida'
      ? 'Perdida em'
      : oportunidade.status === 'fechada'
        ? 'Fechada em'
        : 'Registrada em'

  const fallbackStatus =
    oportunidade.status === 'fechada' || oportunidade.status === 'perdida'
      ? 'orcamento'
      : null
  const statusToReturn = oportunidade.statusAnterior || fallbackStatus
  const isFallback = !oportunidade.statusAnterior && Boolean(fallbackStatus)
  const previousStatusLabel = statusToReturn
    ? STATUS_LABELS[statusToReturn] || statusToReturn
    : null

  const canReopen = Boolean(statusToReturn)

  return (
    <div className="crm-card p-4 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {oportunidade.titulo}
          </h3>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            {oportunidade.cliente.nome}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border ${statusInfo.badge}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {oportunidade.descricao && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {oportunidade.descricao}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {registroLabel}: {formatDate(registroData)}
        </span>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(oportunidade.valor)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Ultimo status: {previousStatusLabel || '-'}
          {isFallback ? ' (padrao)' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Link href={`/oportunidades/${oportunidade.id}/editar`}>
            <Button size="sm" variant="outline">
              Editar
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={!canReopen}
            onClick={() => {
              if (statusToReturn) {
                onReturnToPipeline?.(oportunidade.id, statusToReturn)
              }
            }}
          >
            Reabrir Orçamento
          </Button>
        </div>
      </div>
    </div>
  )
}
