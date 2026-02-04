'use client'

import { useState, useEffect } from 'react'
import { Loader2, ChevronLeft, ChevronRight, Layers } from 'lucide-react'

// Fallback for formatCurrency if not found
const formatMoney = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

interface Oportunidade {
    id: string
    titulo: string
    valor: number | null
    status: string
    createdAt: string
    cliente: {
        nome: string
        email: string | null
        telefone: string | null
        empresa: string | null
    }
    ambiente: {
        nome: string
    }
}

interface Meta {
    total: number
    page: number
    limit: number
    pages: number
}

const TABS = [
    { label: 'Prospecção', value: 'prospeccao' },
    { label: 'Qualificado', value: 'qualificacao' },
    { label: 'Negociação', value: 'negociacao' },
    { label: 'Proposta', value: 'proposta' },
]

export default function GruposPage() {
    const [activeTab, setActiveTab] = useState('prospeccao')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<Oportunidade[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchGrupos = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/grupos?status=${activeTab}&page=${page}&limit=10`)
            const result = await response.json()
            if (response.ok) {
                setData(result.data)
                setMeta(result.meta)
            } else {
                console.error('Erro ao buscar dados:', result)
            }
        } catch (error) {
            console.error('Erro na requisição:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGrupos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, page])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setPage(1) // Reset page on tab change
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id)
        try {
            const response = await fetch(`/api/oportunidades/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                // Refresh data to remove the moved item
                await fetchGrupos() // Or optimistic update, but fetch is safer for pagination
            } else {
                alert('Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            alert('Erro ao atualizar status')
        } finally {
            setUpdatingId(null)
        }
    }

    const getAvailableActions = (currentStatus: string) => {
        return TABS.filter((tab) => tab.value !== currentStatus).map((tab) => ({
            label: tab.label,
            value: tab.value,
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/25">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Grupos de Leads
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gerencie seus leads agrupados por estágio do funil
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.value
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }
              `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
                            <p className="text-gray-600 dark:text-gray-400">Carregando leads...</p>
                        </div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Nenhum lead encontrado neste grupo.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cliente / Empresa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Oportunidade
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Valor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Ambiente
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.cliente.nome}
                                                </span>
                                                {item.cliente.empresa && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.cliente.empresa}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{item.titulo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {formatMoney(item.valor)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {item.ambiente.nome}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-2">
                                                {getAvailableActions(item.status).map((action) => (
                                                    <button
                                                        key={action.value}
                                                        onClick={() => handleStatusChange(item.id, action.value)}
                                                        disabled={updatingId === item.id}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-wait"
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando página <span className="font-medium">{meta.page}</span> de <span className="font-medium">{meta.pages}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                                disabled={page === meta.pages}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
