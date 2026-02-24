/**
 * Card de resultado da geração de dados mockados
 */
'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { SeedResult } from './ConfiguracoesTypes'

interface SeedResultCardProps {
    result: SeedResult
}

export function SeedResultCard({ result }: SeedResultCardProps) {
    return (
        <div
            className={`mt-6 p-4 rounded-lg border ${result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
        >
            <div className="flex items-start">
                {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                    <h3
                        className={`font-semibold mb-2 ${result.success
                            ? 'text-green-900 dark:text-green-300'
                            : 'text-red-900 dark:text-red-300'
                            }`}
                    >
                        {result.success ? 'Sucesso!' : 'Erro'}
                    </h3>
                    {result.success ? (
                        <>
                            <p className="text-green-800 dark:text-green-200 mb-3">
                                {result.message}
                            </p>
                            {result.resumo && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                                        Resumo dos dados criados:
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                            <div className="font-semibold text-green-900 dark:text-green-300">
                                                {result.resumo.clientes}
                                            </div>
                                            <div className="text-xs text-green-700 dark:text-green-400">
                                                Clientes
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                            <div className="font-semibold text-green-900 dark:text-green-300">
                                                {result.resumo.contatos}
                                            </div>
                                            <div className="text-xs text-green-700 dark:text-green-400">
                                                Contatos
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                            <div className="font-semibold text-green-900 dark:text-green-300">
                                                {result.resumo.oportunidades}
                                            </div>
                                            <div className="text-xs text-green-700 dark:text-green-400">
                                                Oportunidades
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded">
                                            <div className="font-semibold text-green-900 dark:text-green-300">
                                                {result.resumo.tarefas}
                                            </div>
                                            <div className="text-xs text-green-700 dark:text-green-400">
                                                Tarefas
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-red-800 dark:text-red-200">
                            {result.error || 'Erro ao criar dados'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
