/**
 * Modal genérico para criar/editar ambiente
 */
'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/common';

interface AmbienteFormModalProps {
    isOpen: boolean;
    title: string;
    nome: string;
    descricao: string;
    onNomeChange: (value: string) => void;
    onDescricaoChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    isSubmitting: boolean;
    submitLabel: string;
    submittingLabel: string;
}

export function AmbienteFormModal({
    isOpen,
    title,
    nome,
    descricao,
    onNomeChange,
    onDescricaoChange,
    onSubmit,
    onClose,
    isSubmitting,
    submitLabel,
    submittingLabel,
}: AmbienteFormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="nome"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="nome"
                            required
                            value={nome}
                            onChange={(e) => onNomeChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Clientes de Produto X"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="descricao"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Descrição
                        </label>
                        <textarea
                            id="descricao"
                            rows={3}
                            value={descricao}
                            onChange={(e) => onDescricaoChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Descrição do ambiente (opcional)"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? submittingLabel : submitLabel}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface DeleteConfirmModalProps {
    isOpen: boolean;
    itemName: string;
    warningMessage: string;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting: boolean;
}

export function DeleteConfirmModal({
    isOpen,
    itemName,
    warningMessage,
    onConfirm,
    onClose,
    isDeleting,
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Confirmar Exclusão
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        disabled={isDeleting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                        Tem certeza que deseja excluir <strong>{itemName}</strong>?
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {warningMessage}
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
