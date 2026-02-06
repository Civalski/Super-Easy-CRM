'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ChevronLeft, ChevronRight, Layers, Eye, ChevronDown } from 'lucide-react'
import { MotivoPerdaModal } from '@/components/features/oportunidades'

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
    type?: 'prospecto' | 'oportunidade'
    subStatus?: string
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
    { label: 'Proposta', value: 'proposta' },
    { label: 'Negociação', value: 'negociacao' },
    { label: 'Vendas', value: 'fechada' },
    { label: 'Perdidas', value: 'perdida' },
]

const STATUS_COLORS: Record<string, string> = {
    prospeccao: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700',
    qualificacao: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 border-blue-200 dark:border-blue-700',
    proposta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 border-yellow-200 dark:border-yellow-700',
    negociacao: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800 border-orange-200 dark:border-orange-700',
    fechada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 border-green-200 dark:border-green-700',
    perdida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 border-red-200 dark:border-red-700',
}

export default function GruposPage() {
    const [activeTab, setActiveTab] = useState('prospeccao')
    const [page, setPage] = useState(1)
    const [data, setData] = useState<Oportunidade[]>([])
    const [meta, setMeta] = useState<Meta | null>(null)
    const [loading, setLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [motivoModalOpen, setMotivoModalOpen] = useState(false)
    const [motivoOportunidadeId, setMotivoOportunidadeId] = useState<string | null>(null)
    const [motivoItemType, setMotivoItemType] = useState<'prospecto' | 'oportunidade'>('oportunidade')
    const [motivoLoading, setMotivoLoading] = useState(false)

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

    const handleStartContact = async (id: string) => {
        setUpdatingId(id)
        try {
            const response = await fetch(`/api/prospectos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'em_contato' })
            })

            if (response.ok) {
                await fetchGrupos()
            } else {
                alert('Erro ao iniciar contato')
            }
        } catch (error) {
            console.error('Erro ao iniciar contato:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const updateOportunidadeStatus = async (id: string, payload: Record<string, any>) => {
        setUpdatingId(id)
        try {
            const response = await fetch(`/api/oportunidades/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                await fetchGrupos()
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

    const handleStatusChange = async (item: Oportunidade, newStatus: string) => {
        if (newStatus === 'perdida') {
            setMotivoOportunidadeId(item.id)
            setMotivoItemType(item.type || 'oportunidade')
            setMotivoModalOpen(true)
            return
        }

        setUpdatingId(item.id)
        try {
            if (item.type === 'prospecto') {
                if (newStatus === 'qualificacao') {
                    await fetch(`/api/prospectos/${item.id}/qualificar`, { method: 'POST' })
                } else if (['proposta', 'negociacao', 'fechada'].includes(newStatus)) {
                    await fetch(`/api/prospectos/${item.id}/promover`, {
                        method: 'POST',
                        body: JSON.stringify({ status: newStatus })
                    })
                }
            } else {
                await updateOportunidadeStatus(item.id, { status: newStatus })
            }
            await fetchGrupos()
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
            alert('Erro ao atualizar status')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleConfirmMotivo = async (motivo: string) => {
        if (!motivoOportunidadeId) return
        setMotivoLoading(true)

        try {
            if (motivoItemType === 'prospecto') {
                await fetch(`/api/prospectos/${motivoOportunidadeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'descartado',
                        observacoes: `Motivo da perda: ${motivo}`
                    })
                })
                await fetchGrupos()
            } else {
                await updateOportunidadeStatus(motivoOportunidadeId, {
                    status: 'perdida',
                    motivoPerda: motivo,
                })
            }
        } catch (error) {
            console.error('Error updating status', error)
        } finally {
            setMotivoLoading(false)
            setMotivoModalOpen(false)
            setMotivoOportunidadeId(null)
        }
    }

    const handleCancelMotivo = () => {
        if (motivoLoading) return
        setMotivoModalOpen(false)
        setMotivoOportunidadeId(null)
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
                            Gestão de Leads
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gerencie seus leads e histórico de vendas
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
                                                {item.type === 'prospecto' && activeTab === 'prospeccao' && (
                                                    <div className="mt-1">
                                                        {item.subStatus === 'novo' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                Frio
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                                                Contatado
                                                            </span>
                                                        )}
                                                    </div>
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
                                                <Link href={`/oportunidades/${item.id}/editar`}>
                                                    <button
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                    >
                                                        <Eye className="w-3 h-3 mr-1.5" />
                                                        Ver mais
                                                    </button>
                                                </Link>
                                                {item.type === 'prospecto' && item.subStatus === 'novo' && (
                                                    <button
                                                        onClick={() => handleStartContact(item.id)}
                                                        disabled={updatingId === item.id}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-purple-300 dark:border-purple-600 shadow-sm text-xs font-medium rounded text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                                                    >
                                                        Iniciar Contato
                                                    </button>
                                                )}
                                                <div className="relative inline-block">
                                                    <select
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Reset select value visually (handled by value="" prop, but good to be safe)
                                                            e.target.value = "";
                                                            handleStatusChange(item, val);
                                                        }}
                                                        value=""
                                                        disabled={updatingId === item.id}
                                                        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="" disabled>Mover para...</option>
                                                        {getAvailableActions(item.status).map((action) => (
                                                            <option key={action.value} value={action.value} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                                                                {action.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
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


            <MotivoPerdaModal
                open={motivoModalOpen}
                onConfirm={handleConfirmMotivo}
                onCancel={handleCancelMotivo}
                loading={motivoLoading}
            />
        </div >
    )
}
