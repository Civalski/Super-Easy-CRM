import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Calendar,
    User,
    FileText,
    CheckCircle2,
    Pencil,
    Trash2,
    AlertCircle,
    Clock
} from '@/lib/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Button from '@/components/common/Button';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/components/common';
import type { TaskNotification } from '@/types/notifications';


interface TaskNotificationModalProps {
    isOpen: boolean;
    task: TaskNotification | null;
    onClose: () => void;
    onUpdate: () => void;
}

export default function TaskNotificationModal({
    isOpen,
    task,
    onClose,
    onUpdate
}: TaskNotificationModalProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !task) return null;

    const handleComplete = async () => {
        try {
            setIsProcessing(true);
            const response = await fetch(`/api/tarefas/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'concluida' }),
            });

            if (response.ok) {
                toast.success('Tarefa concluída!');
                onUpdate();
                onClose();
            }
        } catch (error) {
            console.error('Erro ao finalizar tarefa:', error);
            toast.error('Erro!', { description: 'Não foi possível finalizar a tarefa.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        const ok = await confirm({
            title: 'Excluir tarefa?',
            description: "Esta ação não poderá ser desfeita.",
            confirmLabel: 'Sim, excluir',
            cancelLabel: 'Cancelar',
            confirmVariant: 'danger',
        });

        if (!ok) return;

        try {
            setIsProcessing(true);
            const response = await fetch(`/api/tarefas/${task.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Excluído!', { description: 'A tarefa foi excluída com sucesso.' });
                onUpdate();
                onClose();
            }
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
            toast.error('Erro!', { description: 'Ocorreu um erro ao excluir a tarefa.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEdit = () => {
        onClose();
        router.push(`/tarefas?edit=${task.id}`);
    };

    const dueDate = task.dataVencimento ? new Date(task.dataVencimento) : null;
    const isOverdue = dueDate ? dueDate < new Date() : false;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'alta': return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400';
            case 'media': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400';
            case 'baixa': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="crm-card w-full max-w-lg overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            {task.prioridade && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getPriorityColor(task.prioridade)}`}>
                                    {task.prioridade}
                                </span>
                            )}
                            {isOverdue && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                    <AlertCircle size={12} />
                                    Atrasada
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            {task.titulo}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {task.descricao && (
                        <div className="flex gap-3 text-gray-600 dark:text-gray-300">
                            <FileText size={18} className="mt-1 text-gray-400 shrink-0" />
                            <p className="text-sm leading-relaxed">{task.descricao}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={12} /> Vencimento
                            </span>
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {task.dataVencimento ? format(new Date(task.dataVencimento), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Sem data'}
                            </p>
                        </div>

                        {task.cliente && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <User size={12} /> Cliente
                                </span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {task.cliente.nome}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-100 dark:border-gray-700">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isProcessing}
                        className="w-full sm:w-auto order-3 sm:order-1"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Excluir
                    </Button>

                    <div className="flex-1" /> {/* Spacer */}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        disabled={isProcessing}
                        className="w-full sm:w-auto order-2"
                    >
                        <Pencil size={16} className="mr-2" />
                        Editar
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleComplete}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-3"
                    >
                        <CheckCircle2 size={16} className="mr-2" />
                        Finalizar
                    </Button>
                </div>
            </div>
        </div>
    );
}

