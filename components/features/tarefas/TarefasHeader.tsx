/**
 * Header da página de tarefas
 * Design consistente com outras páginas do CRM
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, CheckSquare } from 'lucide-react'

interface TarefasHeaderProps {
    onCreateClick?: () => void
}

export function TarefasHeader({ onCreateClick }: TarefasHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                    <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tarefas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerencie suas tarefas e atividades
                    </p>
                </div>
            </div>
            {onCreateClick ? (
                <Button onClick={onCreateClick}>
                    <Plus size={20} className="mr-2" />
                    Nova Tarefa
                </Button>
            ) : (
                <Link href="/tarefas/nova">
                    <Button>
                        <Plus size={20} className="mr-2" />
                        Nova Tarefa
                    </Button>
                </Link>
            )}
        </div>
    )
}
