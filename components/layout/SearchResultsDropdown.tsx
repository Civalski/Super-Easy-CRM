/**
 * Componente de resultados de busca global
 */
'use client';

import { User, Briefcase, ClipboardList } from '@/lib/icons';
import type { BuscaResultado } from '@/lib/hooks/useGlobalSearch';

interface SearchResultsDropdownProps {
    resultados: BuscaResultado | null;
    carregando: boolean;
    totalResultados: number;
    onClienteClick: (id: string) => void;
    onOportunidadeClick: (id: string) => void;
    onPedidoClick: (id: string) => void;
}

export function SearchResultsDropdown({
    resultados,
    carregando,
    totalResultados,
    onClienteClick,
    onOportunidadeClick,
    onPedidoClick,
}: SearchResultsDropdownProps) {
    return (
        <div className="absolute top-full left-0 right-0 mt-2 crm-card min-w-full max-h-96 overflow-y-auto z-50 shadow-xl">
            {carregando ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Buscando...
                </div>
            ) : totalResultados === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum resultado encontrado
                </div>
            ) : (
                <>
                    {/* Clientes */}
                    {resultados?.clientes && resultados.clientes.length > 0 && (
                        <div>
                            <div className="px-4 py-2 crm-table-head">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Clientes ({resultados.clientes.length})
                                </h3>
                            </div>
                            {resultados.clientes.map((cliente) => (
                                <button
                                    key={cliente.id}
                                    onClick={() => onClienteClick(cliente.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-100/65 dark:hover:bg-slate-800/72 transition-colors border-b border-slate-200/70 dark:border-slate-700/70 last:border-b-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                                            <User size={16} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white break-words line-clamp-2">
                                                {cliente.numero != null ? `#${cliente.numero} ` : ''}{cliente.nome}
                                            </div>
                                            {cliente.empresa && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-1">
                                                    {cliente.empresa}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Orcamentos */}
                    {resultados?.oportunidades && resultados.oportunidades.length > 0 && (
                        <div>
                            <div className="px-4 py-2 crm-table-head">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Orcamentos ({resultados.oportunidades.length})
                                </h3>
                            </div>
                            {resultados.oportunidades.map((oportunidade) => (
                                <button
                                    key={oportunidade.id}
                                    onClick={() => onOportunidadeClick(oportunidade.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-100/65 dark:hover:bg-slate-800/72 transition-colors border-b border-slate-200/70 dark:border-slate-700/70 last:border-b-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                                            <Briefcase size={16} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white break-words line-clamp-2">
                                                Orçamento #{oportunidade.numero}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-1">
                                                {oportunidade.cliente.nome}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pedidos */}
                    {resultados?.pedidos && resultados.pedidos.length > 0 && (
                        <div>
                            <div className="px-4 py-2 crm-table-head">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    Pedidos ({resultados.pedidos.length})
                                </h3>
                            </div>
                            {resultados.pedidos.map((pedido) => (
                                <button
                                    key={pedido.id}
                                    onClick={() => onPedidoClick(pedido.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-100/65 dark:hover:bg-slate-800/72 transition-colors border-b border-slate-200/70 dark:border-slate-700/70 last:border-b-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                                            <ClipboardList size={16} className="text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white break-words line-clamp-2">
                                                Pedido #{pedido.numero}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 break-words line-clamp-1">
                                                {pedido.oportunidade.titulo} | {pedido.oportunidade.cliente.nome}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
