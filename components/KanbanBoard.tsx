'use client'

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import OportunidadeCard from './OportunidadeCard'

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

interface KanbanBoardProps {
  oportunidades: Oportunidade[]
  onStatusChange: (id: string, newStatus: string) => void
}

const COLUMNS = [
  { id: 'prospeccao', title: 'Prospecção', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'proposta', title: 'Proposta', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-orange-100 dark:bg-orange-900' },
  { id: 'fechada', title: 'Fechada', color: 'bg-green-100 dark:bg-green-900' },
  { id: 'perdida', title: 'Perdida', color: 'bg-red-100 dark:bg-red-900' },
]

export default function KanbanBoard({ oportunidades, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getOportunidadesByStatus = (status: string) => {
    return oportunidades.filter((opp) => opp.status === status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Se soltou em uma coluna (não em outro card)
    if (COLUMNS.some((col) => col.id === overId)) {
      const oportunidade = oportunidades.find((opp) => opp.id === activeId)
      if (oportunidade && oportunidade.status !== overId) {
        onStatusChange(activeId, overId)
      }
    }

    setActiveId(null)
  }

  const activeOportunidade = oportunidades.find((opp) => opp.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {COLUMNS.map((column) => {
          const columnOportunidades = getOportunidadesByStatus(column.id)
          
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
            >
              <SortableContext
                items={columnOportunidades.map((opp) => opp.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnOportunidades.map((oportunidade) => (
                  <OportunidadeCard
                    key={oportunidade.id}
                    oportunidade={oportunidade}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeOportunidade ? (
          <OportunidadeCard oportunidade={activeOportunidade} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

