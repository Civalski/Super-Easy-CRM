/**
 * Tabela de listagem de clientes
 */
'use client'

import Link from 'next/link'
import {
    Mail,
    Phone,
    Briefcase,
    Users,
    Eye,
    Edit2,
    FileText,
    Trash2,
    BadgeDollarSign,
    Tag,
} from 'lucide-react'

export interface Cliente {
    id: string
    nome: string
    email: string | null
    telefone: string | null
    empresa: string | null
    _count: {
        oportunidades: number
        contatos: number
    }
    prospecto?: {
        cnaePrincipalDesc: string | null
        capitalSocial: string | null
    } | null
}

interface ClientesTableProps {
    clientes: Cliente[]
    deletingId: string | null
    onDeleteClick: (cliente: Cliente) => void
}

export function ClientesTable({ clientes, deletingId, onDeleteClick }: ClientesTableProps) {
    // Função para formatar o capital social
    const formatCapitalSocial = (capitalSocial: string | null | undefined): string => {
        if (!capitalSocial) return '-';
        const valorStr = String(capitalSocial);
        const valorLimpo = valorStr.replace(/\./g, '').replace(',', '.');
        const valor = Number(valorLimpo);
        if (isNaN(valor)) return `R$ ${valorStr}`;
        // Formato compacto para valores grandes
        if (valor >= 1000000) {
            return `R$ ${(valor / 1000000).toFixed(1)}M`;
        }
        if (valor >= 1000) {
            return `R$ ${(valor / 1000).toFixed(1)}K`;
        }
        return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="crm-card overflow-hidden">
            <table className="w-full table-fixed">
                <thead className="crm-table-head">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[22%]">
                            Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">
                            Contato
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[25%]">
                            Atividade Principal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[13%]">
                            Capital
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {clientes.map((cliente) => (
                        <tr
                            key={cliente.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2 flex-shrink-0">
                                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                            {cliente.nome.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={cliente.nome}>
                                            {cliente.nome}
                                        </div>
                                        {/* Estatísticas inline */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="flex items-center" title="Orçamentos">
                                                <Briefcase size={10} className="mr-0.5" />
                                                {cliente._count.oportunidades}
                                            </span>
                                            <span className="flex items-center" title="Contatos">
                                                <Users size={10} className="mr-0.5" />
                                                {cliente._count.contatos}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="space-y-0.5 min-w-0">
                                    {cliente.email && (
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                            <Mail size={12} className="mr-1 flex-shrink-0" />
                                            <span className="truncate" title={cliente.email}>{cliente.email}</span>
                                        </div>
                                    )}
                                    {cliente.telefone && (
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                            <Phone size={12} className="mr-1 flex-shrink-0" />
                                            <span className="truncate">{cliente.telefone}</span>
                                        </div>
                                    )}
                                    {!cliente.email && !cliente.telefone && (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                {cliente.prospecto?.cnaePrincipalDesc ? (
                                    <div className="flex items-start text-xs text-gray-900 dark:text-white min-w-0">
                                        <Tag size={12} className="mr-1 mt-0.5 text-purple-500 flex-shrink-0" />
                                        <span className="line-clamp-2" title={cliente.prospecto.cnaePrincipalDesc}>
                                            {cliente.prospecto.cnaePrincipalDesc}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {cliente.prospecto?.capitalSocial ? (
                                    <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                                        <BadgeDollarSign size={12} className="mr-0.5 flex-shrink-0" />
                                        <span title={`R$ ${cliente.prospecto.capitalSocial}`}>
                                            {formatCapitalSocial(cliente.prospecto.capitalSocial)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/clientes/${cliente.id}`}
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        <Eye size={14} className="mr-0.5" />
                                        Ver
                                    </Link>
                                    <Link
                                        href={`/clientes/${cliente.id}?acao=editar`}
                                        className="inline-flex items-center text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    >
                                        <Edit2 size={14} className="mr-0.5" />
                                        Editar
                                    </Link>
                                    <Link
                                        href={{
                                            pathname: '/oportunidades',
                                            query: {
                                                novoOrcamento: '1',
                                                clienteId: cliente.id,
                                                clienteNome: cliente.nome,
                                            },
                                        }}
                                        className="inline-flex items-center text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    >
                                        <FileText size={14} className="mr-0.5" />
                                        Orcamento
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteClick(cliente)}
                                        disabled={deletingId === cliente.id}
                                        className="inline-flex items-center text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                    >
                                        {deletingId === cliente.id ? (
                                            '...'
                                        ) : (
                                            <>
                                                <Trash2 size={14} className="mr-0.5" />
                                                Excluir
                                            </>
                                        )}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
