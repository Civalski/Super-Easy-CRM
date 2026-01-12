/**
 * Componente de resultado de importação
 * Exibe feedback após importar prospectos
 */
'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ImportResult {
    success: boolean;
    importados: number;
    duplicados: number;
    erros: string[];
    mensagem: string;
}

interface ImportResultAlertProps {
    result: ImportResult;
}

export function ImportResultAlert({ result }: ImportResultAlertProps) {
    return (
        <div className={`p-4 rounded-lg border ${result.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            }`}>
            <div className="flex items-start gap-3">
                {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                    <p className={`font-medium ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {result.mensagem}
                    </p>
                    {result.success && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            ✓ {result.importados} importado(s) | ⊘ {result.duplicados} duplicado(s)
                        </p>
                    )}
                    {result.erros && result.erros.length > 0 && (
                        <ul className="text-sm text-red-600 dark:text-red-400 mt-2 list-disc pl-4">
                            {result.erros.map((erro, idx) => (
                                <li key={idx}>{erro}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
