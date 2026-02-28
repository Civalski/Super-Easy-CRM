/**
 * Estado vazio para tarefas
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus, Calendar, History } from 'lucide-react'
import type { TabType } from './TarefasTypes'

interface TarefasEmptyStateProps {
    activeTab: TabType
    onCreateClick?: () => void
}

export function TarefasEmptyState({ activeTab, onCreateClick }: TarefasEmptyStateProps) {
    if (activeTab === 'pendentes') {
        return (
            <div className="crm-card p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma tarefa pendente
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Todas as suas tarefas estão concluídas! Parabéns!
                </p>
                {onCreateClick ? (
                    <Button onClick={onCreateClick}>
                        <Plus size={20} className="mr-2" />
                        Criar Nova Tarefa
                    </Button>
                ) : (
                    <Link href="/tarefas/nova">
                        <Button>
                            <Plus size={20} className="mr-2" />
                            Criar Nova Tarefa
                        </Button>
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="crm-card p-12 text-center">
            <History size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma tarefa concluída
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
                As tarefas concluídas aparecerão aqui.
            </p>
        </div>
    )
}
