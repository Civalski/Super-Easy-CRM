/**
 * Header da página de busca de leads
 * Design consistente com outras páginas do CRM
 */
'use client';

import { Search, Database } from 'lucide-react';

import { DataManagementButton } from './DataManagementButton';

interface LeadsHeaderProps {
    totalLeads?: number | null;
    isLoading?: boolean;
}

export function LeadsHeader({ totalLeads, isLoading }: LeadsHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                    <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Busca de Leads
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Encontre empresas qualificadas para prospecção
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <DataManagementButton />

                {/* Indicador de base de dados */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isLoading ? (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                Carregando...
                            </span>
                        ) : totalLeads ? (
                            <span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {totalLeads.toLocaleString('pt-BR')}
                                </span>
                                {' '}leads encontrados
                            </span>
                        ) : (
                            'Base de dados CNPJ'
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
