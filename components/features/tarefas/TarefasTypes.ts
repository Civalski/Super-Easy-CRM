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
        color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900',
    },
    em_andamento: {
        label: 'Em Andamento',
        icon: AlertCircle,
        color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
    },
    concluida: {
        label: 'Concluída',
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900',
    },
}

export const prioridadeConfig = {
    baixa: {
        label: 'Baixa',
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    },
    media: {
        label: 'Média',
        color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    },
    alta: {
        label: 'Alta',
        color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    },
}

export type TabType = 'pendentes' | 'historico'
