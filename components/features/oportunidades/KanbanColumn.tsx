'use client'

import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  children: ReactNode
}

export default function KanbanColumn({ id, title, color, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 min-h-[500px] transition-colors ${isOver ? 'bg-opacity-80' : ''
        } ${color}`}
    >
      <h2 className="text-lg font-semibold mb-4 text-center text-white">{title}</h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

