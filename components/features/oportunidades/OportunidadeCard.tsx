'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface OportunidadeCardProps {
  oportunidade: Oportunidade
  isDragging?: boolean
}

export default function OportunidadeCard({ oportunidade, isDragging }: OportunidadeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: oportunidade.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-600 ${
        isDragging ? 'shadow-2xl' : ''
      }`}
    >
      <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">
        {oportunidade.titulo}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {oportunidade.cliente.nome}
      </p>
      {oportunidade.descricao && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 line-clamp-2">
          {oportunidade.descricao}
        </p>
      )}
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(oportunidade.valor)}
        </span>
        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
          {oportunidade.probabilidade}%
        </span>
      </div>
    </div>
  )
}

