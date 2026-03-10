/**
 * Card individual de uma tarefa
 */
'use client'

import { Button } from '@/components/common'
import { Calendar, CheckCircle2, Loader2, Pencil, RotateCcw, Trash2 } from '@/lib/icons'
import { statusConfig, prioridadeConfig, type Tarefa, type TabType } from './TarefasTypes'

interface TarefaCardProps {
    tarefa: Tarefa
    activeTab: TabType
    atualizandoTarefa: string | null
    excluindoTarefa: string | null
    onVoltarParaPendente: (tarefaId: string) => void
    onConcluirTarefa: (tarefaId: string) => void
    onExcluirTarefa: (tarefaId: string) => void
    onEditTarefa: (tarefaId: string) => void
}

function getVencimentoStatus(dataVencimento: Date | null): 'ok' | 'proximo' | 'atrasado' {
    if (!dataVencimento) return 'ok'
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const venc = new Date(dataVencimento)
    venc.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'atrasado'
    if (diffDays <= 2) return 'proximo'
    return 'ok'
}

export function TarefaCard({
    tarefa,
    activeTab,
    atualizandoTarefa,
    excluindoTarefa,
    onVoltarParaPendente,
    onConcluirTarefa,
    onExcluirTarefa,
    onEditTarefa,
}: TarefaCardProps) {
    const statusInfo = statusConfig[tarefa.status as keyof typeof statusConfig] || statusConfig.pendente
    const prioridadeInfo = prioridadeConfig[tarefa.prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.media
    const StatusIcon = statusInfo.icon
    const iconColor = 'iconColor' in statusInfo ? statusInfo.iconColor : statusInfo.color.split(' ')[0]
    const isAtualizando = atualizandoTarefa === tarefa.id
    const isExcluindo = excluindoTarefa === tarefa.id
    const vencimentoStatus = getVencimentoStatus(tarefa.dataVencimento)

    const formatDate = (date: Date | null) => {
        if (!date) return '-'
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(date))
    }

    const vencimentoClass =
        vencimentoStatus === 'atrasado'
            ? 'text-red-600 dark:text-red-400 font-medium'
            : vencimentoStatus === 'proximo'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-400'

    return (
        <div className="crm-card crm-card-hover relative overflow-hidden pl-1">
            {/* Barra lateral por prioridade */}
            <div
                className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${
                    tarefa.prioridade === 'alta'
                        ? 'bg-red-400 dark:bg-red-500'
                        : tarefa.prioridade === 'media'
                          ? 'bg-amber-400 dark:bg-amber-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                }`}
            />
            <div className="p-4 pl-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 min-w-0">
                        {tarefa.titulo}
                    </h3>
                    <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium ${prioridadeInfo.color}`}
                    >
                        {prioridadeInfo.label}
                    </span>
                </div>

                {tarefa.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {tarefa.descricao}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-4">
                    <span className="inline-flex items-center gap-1.5">
                        <StatusIcon size={14} className={iconColor} />
                        <span className="text-gray-600 dark:text-gray-400">{statusInfo.label}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 ${vencimentoClass}`}>
                        <Calendar size={14} />
                        {formatDate(tarefa.dataVencimento)}
                        {vencimentoStatus === 'atrasado' && (
                            <span className="text-[10px] uppercase tracking-wide">Atrasado</span>
                        )}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700/80">
                    <button
                        type="button"
                        onClick={() => onEditTarefa(tarefa.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:border-amber-300 hover:text-amber-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-amber-900/30 dark:hover:border-amber-600 dark:hover:text-amber-300"
                        title="Editar"
                    >
                        <Pencil size={14} />
                        Editar
                    </button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onExcluirTarefa(tarefa.id)}
                        disabled={isExcluindo || isAtualizando}
                        className="h-7 px-2.5 text-xs"
                        title="Excluir"
                    >
                        {isExcluindo ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <>
                                <Trash2 size={14} className="sm:mr-1" />
                                <span className="hidden sm:inline">Excluir</span>
                            </>
                        )}
                    </Button>

                    {activeTab === 'historico' ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVoltarParaPendente(tarefa.id)}
                            disabled={isAtualizando || isExcluindo}
                            className="h-7 px-2.5 text-xs ml-auto"
                            title="Restaurar para Pendente"
                        >
                            {isAtualizando ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <>
                                    <RotateCcw size={14} className="sm:mr-1" />
                                    <span className="hidden sm:inline">Restaurar</span>
                                </>
                            )}
                        </Button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onConcluirTarefa(tarefa.id)}
                            disabled={isAtualizando || isExcluindo}
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-emerald-600 dark:text-emerald-300 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 ml-auto"
                            title="Concluir Tarefa"
                        >
                            {isAtualizando ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    Concluir
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
