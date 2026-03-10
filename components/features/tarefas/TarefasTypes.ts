/**
 * Configurações de status e prioridade para tarefas
 */
import { Clock, AlertCircle, CheckCircle2 } from '@/lib/icons'

export interface Tarefa {
    id: string
    titulo: string
    descricao: string | null
    status: string
    prioridade: string
    dataVencimento: Date | null
    clienteId: string | null
    oportunidadeId: string | null
    createdAt: string | Date
    updatedAt: string | Date
}

export const statusConfig = {
    pendente: {
        label: 'Pendente',
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    em_andamento: {
        label: 'Em Andamento',
        icon: AlertCircle,
        color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    concluida: {
        label: 'Concluída',
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50',
        iconColor: 'text-green-600 dark:text-green-400',
    },
}

export const prioridadeConfig = {
    baixa: {
        label: 'Baixa',
        color: 'bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    },
    media: {
        label: 'Média',
        color: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    },
    alta: {
        label: 'Alta',
        color: 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    },
}

export type TabType = 'pendentes' | 'historico'
