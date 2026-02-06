/**
 * Card individual de uma tarefa
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/common'
import { Calendar, CheckCircle2, Loader2, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { statusConfig, prioridadeConfig, type Tarefa, type TabType } from './TarefasTypes'

interface TarefaCardProps {
    tarefa: Tarefa
    activeTab: TabType
    atualizandoTarefa: string | null
    excluindoTarefa: string | null
    onVoltarParaPendente: (tarefaId: string) => void
    onConcluirTarefa: (tarefaId: string) => void
    onExcluirTarefa: (tarefaId: string) => void
}

export function TarefaCard({
    tarefa,
    activeTab,
    atualizandoTarefa,
    excluindoTarefa,
    onVoltarParaPendente,
    onConcluirTarefa,
    onExcluirTarefa,
}: TarefaCardProps) {
    const statusInfo = statusConfig[tarefa.status as keyof typeof statusConfig] || statusConfig.pendente
    const prioridadeInfo = prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.media
    const StatusIcon = statusInfo.icon
    const isAtualizando = atualizandoTarefa === tarefa.id
    const isExcluindo = excluindoTarefa === tarefa.id

    const formatDate = (date: Date | null) => {
        if (!date) return '-'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date))
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {tarefa.titulo}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${prioridadeInfo.color}`}>
                    {prioridadeInfo.label}
                </div>
            </div>

            {tarefa.descricao && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {tarefa.descricao}
                </p>
            )}

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={statusInfo.color.split(' ')[0]} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {statusInfo.label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Vencimento: {formatDate(tarefa.dataVencimento)}
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <Link href={`/tarefas/${tarefa.id}/editar`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" title="Editar">
                        <Pencil size={16} />
                    </Button>
                </Link>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onExcluirTarefa(tarefa.id)}
                    disabled={isExcluindo || isAtualizando}
                    className="flex-1"
                    title="Excluir"
                >
                    {isExcluindo ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Trash2 size={16} />
                    )}
                </Button>

                {activeTab === 'historico' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVoltarParaPendente(tarefa.id)}
                        disabled={isAtualizando || isExcluindo}
                        className="flex-1"
                        title="Restaurar para Pendente"
                    >
                        {isAtualizando ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RotateCcw size={16} />
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onConcluirTarefa(tarefa.id)}
                        disabled={isAtualizando || isExcluindo}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        title="Concluir Tarefa"
                    >
                        {isAtualizando ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={16} />
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
