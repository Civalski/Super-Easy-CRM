'use client'

import { useState } from 'react'
import EstadoCidadeSelector from '@/components/EstadoCidadeSelector'
import { MapPin, Info } from 'lucide-react'

export default function LeadsPage() {
    const [estadoSelecionado, setEstadoSelecionado] = useState<string | null>(null)
    const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([])

    const handleSelectionChange = (estado: string | null, cidades: string[]) => {
        setEstadoSelecionado(estado)
        setCidadesSelecionadas(cidades)
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Leads
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Gerencie seus leads e oportunidades de negócio
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Seleção */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <MapPin className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Seleção de Localização
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Escolha o estado e as cidades para buscar leads
                                </p>
                            </div>
                        </div>

                        <EstadoCidadeSelector
                            onSelectionChange={handleSelectionChange}
                            className="mt-6"
                        />

                        {/* Informação sobre dados */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex gap-3">
                                <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-medium mb-1">Dados disponíveis</p>
                                    <p className="text-blue-600 dark:text-blue-400">
                                        Os dados de leads estão organizados por estado e cidade. Selecione um estado
                                        para visualizar as cidades disponíveis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Painel de Resumo */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Seleção Atual
                        </h3>

                        {estadoSelecionado ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Estado
                                    </label>
                                    <div className="mt-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                            {estadoSelecionado}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cidades
                                    </label>
                                    <div className="mt-1">
                                        {cidadesSelecionadas.length > 0 ? (
                                            <div className="space-y-1">
                                                {cidadesSelecionadas.map((cidade) => (
                                                    <div
                                                        key={cidade}
                                                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                                                    >
                                                        {cidade}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 text-center">
                                                Nenhuma cidade selecionada
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Total de cidades selecionadas
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {cidadesSelecionadas.length}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MapPin className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Selecione um estado para começar
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview de dados (placeholder para futuro) */}
            {estadoSelecionado && cidadesSelecionadas.length > 0 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Leads Encontrados
                    </h3>
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 mb-4">
                            <MapPin className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            Integração com dados em desenvolvimento
                        </p>
                        <p className="text-sm text-gray-400">
                            Os leads de <strong>{cidadesSelecionadas.join(', ')}</strong> ({estadoSelecionado}) serão exibidos aqui
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
