/**
 * Header da página de tarefas
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Plus } from 'lucide-react'

export function TarefasHeader() {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Tarefas
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Gerencie suas tarefas e atividades
                </p>
            </div>
            <Link href="/tarefas/nova">
                <Button>
                    <Plus size={20} className="mr-2" />
                    Nova Tarefa
                </Button>
            </Link>
        </div>
    )
}
