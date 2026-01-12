/**
 * Modal de observações do prospecto
 */
'use client'

import { Loader2 } from 'lucide-react';

interface ObservacoesModalProps {
    isOpen: boolean;
    observacoes: string;
    saving: boolean;
    onObservacoesChange: (value: string) => void;
    onSave: () => void;
    onClose: () => void;
}

export function ObservacoesModal({
    isOpen,
    observacoes,
    saving,
    onObservacoesChange,
    onSave,
    onClose,
}: ObservacoesModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Observações
                </h3>
                <textarea
                    value={observacoes}
                    onChange={(e) => onObservacoesChange(e.target.value)}
                    placeholder="Digite suas observações sobre este prospecto..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
