'use client';

/**
 * Visualizacao de Leads por Lotes
 * Exibe cada lote como um card expansivel com opcao de envio imediato
 * e configuracao de envio agendado.
 */
import { useMemo, useState } from 'react';
import {
    Package,
    ChevronDown,
    ChevronRight,
    Send,
    Loader2,
    Calendar,
    Users,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import type { AgendamentoEnvio, Prospecto } from './ProspectarTypes';

interface LoteSummary {
    lote: string;
    total: number;
    dataImportacao: string | null;
}

interface PlanoAgendamentoItem {
    lote: string;
    dataEnvio: string;
}

interface LotesViewProps {
    lotes: LoteSummary[];
    totalGeral: number;
    loadingLotes: boolean;
    isSending: boolean;
    isDeleting: boolean;
    agendamentos: AgendamentoEnvio[];
    loadingAgendamentos: boolean;
    isScheduling: boolean;
    cancellingScheduleId: string | null;
    onEnviarLote: (lote: string) => Promise<void>;
    onEnviarTodos: () => Promise<void>;
    onExcluirLote: (lote: string) => Promise<void>;
    onAgendarLotes: (itens: PlanoAgendamentoItem[]) => Promise<void>;
    onCancelarAgendamento: (id: string) => Promise<void>;
    onRefresh: () => void;
}

const WEEK_DAYS = [
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sab' },
    { value: 0, label: 'Dom' },
];

const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatSimpleDate = (value: string) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
};

const getTodayInputDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildPlano = (
    lotes: LoteSummary[],
    dataInicio: string,
    diasSemanaSelecionados: number[]
): PlanoAgendamentoItem[] => {
    if (!dataInicio || lotes.length === 0 || diasSemanaSelecionados.length === 0) {
        return [];
    }

    const diasPermitidos = new Set(diasSemanaSelecionados);
    const cursor = new Date(`${dataInicio}T12:00:00`);

    if (Number.isNaN(cursor.getTime())) {
        return [];
    }

    const plano: PlanoAgendamentoItem[] = [];

    for (const lote of lotes) {
        while (!diasPermitidos.has(cursor.getDay())) {
            cursor.setDate(cursor.getDate() + 1);
        }

        plano.push({
            lote: lote.lote,
            dataEnvio: toISODate(cursor),
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    return plano;
};

function StatusBadge({ status }: { status: AgendamentoEnvio['status'] }) {
    const styles: Record<AgendamentoEnvio['status'], string> = {
        pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        processando: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        processado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        cancelado: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        erro: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    const labels: Record<AgendamentoEnvio['status'], string> = {
        pendente: 'Pendente',
        processando: 'Processando',
        processado: 'Processado',
        cancelado: 'Cancelado',
        erro: 'Erro',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

// Badge de tamanho do lote
function TamanhoBadge({ total }: { total: number }) {
    const cor =
        total >= 50 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
            total >= 20 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cor}`}>
            <Users className="w-3 h-3" />
            {total.toLocaleString('pt-BR')} leads
        </span>
    );
}

// Card de um lote individual
function LoteCard({
    lote,
    isSending,
    isDeleting,
    onEnviarLote,
    onExcluirLote,
}: {
    lote: LoteSummary;
    isSending: boolean;
    isDeleting: boolean;
    onEnviarLote: (lote: string) => Promise<void>;
    onExcluirLote: (lote: string) => Promise<void>;
}) {
    const [expandido, setExpandido] = useState(false);
    const [leads, setLeads] = useState<Prospecto[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [enviandoEste, setEnviandoEste] = useState(false);
    const [excluindoEste, setExcluindoEste] = useState(false);

    const carregarLeads = async () => {
        if (leads.length > 0) {
            setExpandido(!expandido);
            return;
        }
        setExpandido(true);
        setLoadingLeads(true);
        try {
            const params = new URLSearchParams({
                origem: 'leads',
                lote: lote.lote === '(sem lote)' ? '' : lote.lote,
                limit: '200',
                offset: '0',
            });
            const res = await fetch(`/api/prospectos?${params}`);
            const data = await res.json();
            setLeads(data.prospectos || []);
        } catch {
            setLeads([]);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleEnviar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setEnviandoEste(true);
        try {
            await onEnviarLote(lote.lote);
            setLeads([]);
            setExpandido(false);
        } finally {
            setEnviandoEste(false);
        }
    };

    const handleExcluir = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setExcluindoEste(true);
        try {
            await onExcluirLote(lote.lote);
        } finally {
            setExcluindoEste(false);
        }
    };

    const isBusy = isSending || isDeleting || enviandoEste || excluindoEste;

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-600 transition-all duration-200">
            <div
                className="flex items-center gap-4 p-4 cursor-pointer select-none bg-gray-800 hover:bg-[#2d3748] transition-colors duration-150"
                onClick={carregarLeads}
            >
                <span className="text-gray-500 flex-shrink-0">
                    {expandido
                        ? <ChevronDown className="w-5 h-5" />
                        : <ChevronRight className="w-5 h-5" />
                    }
                </span>

                <div className="p-2 bg-sky-900/40 rounded-lg flex-shrink-0">
                    <Package className="w-5 h-5 text-sky-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm truncate">
                            {lote.lote}
                        </h3>
                        <TamanhoBadge total={lote.total} />
                    </div>
                    {lote.dataImportacao && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            Importado em {formatDate(lote.dataImportacao)}
                        </div>
                    )}
                </div>

                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">
                        {lote.total}
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={handleEnviar}
                        disabled={isBusy}
                        title={`Enviar lote "${lote.lote}" ao funil`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-300 dark:border-purple-600 shadow-sm text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium rounded-lg transition-colors"
                    >
                        {enviandoEste
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline">Enviar ao funil</span>
                    </button>

                    <button
                        onClick={handleExcluir}
                        disabled={isBusy}
                        title={`Excluir lote "${lote.lote}"`}
                        className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-600 text-gray-400 hover:border-red-700 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium rounded-lg transition-colors"
                    >
                        {excluindoEste
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                    </button>
                </div>
            </div>

            {expandido && (
                <div className="border-t border-gray-700">
                    {loadingLeads ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Carregando leads...</span>
                        </div>
                    ) : leads.length === 0 ? (
                        <p className="text-center py-6 text-sm text-gray-500">
                            Nenhum lead encontrado neste lote
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-700/60">
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-900/60">
                                <div className="col-span-5">Empresa</div>
                                <div className="col-span-3">Municipio/UF</div>
                                <div className="col-span-2">CNPJ</div>
                                <div className="col-span-2">Telefone</div>
                            </div>

                            {leads.map((lead, idx) => (
                                <div
                                    key={lead.id}
                                    className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm ${idx % 2 === 0
                                        ? 'bg-gray-800'
                                        : 'bg-gray-800/50'
                                        } hover:bg-gray-700/50 transition-colors`}
                                >
                                    <div className="col-span-5 min-w-0">
                                        <p className="font-medium text-gray-100 truncate">
                                            {lead.nomeFantasia || lead.razaoSocial}
                                        </p>
                                        {lead.nomeFantasia && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {lead.razaoSocial}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-3 text-gray-400 truncate self-center text-xs">
                                        {lead.municipio} / {lead.uf}
                                    </div>
                                    <div className="col-span-2 text-gray-500 truncate self-center text-xs font-mono">
                                        {lead.cnpj}
                                    </div>
                                    <div className="col-span-2 text-gray-500 truncate self-center text-xs">
                                        {lead.telefone1 || '-'}
                                    </div>
                                </div>
                            ))}

                            {leads.length >= 200 && (
                                <p className="text-center py-3 text-xs text-gray-500 bg-gray-900/40">
                                    Mostrando os primeiros 200 leads. Use &quot;Enviar ao funil&quot; para processar todos.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Componente principal
export function LotesView({
    lotes,
    totalGeral,
    loadingLotes,
    isSending,
    isDeleting,
    agendamentos,
    loadingAgendamentos,
    isScheduling,
    cancellingScheduleId,
    onEnviarLote,
    onEnviarTodos,
    onExcluirLote,
    onAgendarLotes,
    onCancelarAgendamento,
    onRefresh,
}: LotesViewProps) {
    const [showScheduler, setShowScheduler] = useState(false);
    const [dataInicio, setDataInicio] = useState(getTodayInputDate());
    const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState<number[]>([1, 2, 3, 4, 5]);

    const plano = useMemo(
        () => buildPlano(lotes, dataInicio, diasSemanaSelecionados),
        [lotes, dataInicio, diasSemanaSelecionados]
    );

    const agendamentosOrdenados = useMemo(
        () => [...agendamentos].sort((a, b) => `${a.dataEnvio}${a.createdAt}`.localeCompare(`${b.dataEnvio}${b.createdAt}`)),
        [agendamentos]
    );

    const toggleDiaSemana = (day: number) => {
        setDiasSemanaSelecionados((prev) => {
            if (prev.includes(day)) {
                return prev.filter((item) => item !== day);
            }
            return [...prev, day].sort((a, b) => a - b);
        });
    };

    const handleSalvarAgendamento = async () => {
        if (plano.length === 0) return;
        await onAgendarLotes(plano);
    };

    if (loadingLotes) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                <p className="text-sm">Carregando lotes...</p>
            </div>
        );
    }

    if (lotes.length === 0) {
        return (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="font-medium text-gray-400">Nenhum lote com leads frios</p>
                <p className="text-sm text-gray-500 mt-1">
                    Seus lotes de leads acabaram. Para adquirir novos lotes, entre em contato com a Arkersoft.
                </p>
                <a
                    href="https://wa.me/5519998205608"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                    WhatsApp Arkersoft: (19) 99820-5608
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="bg-gradient-to-r from-sky-900/30 to-indigo-900/30 border border-sky-800/50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-sky-300">
                                {lotes.length}
                            </div>
                            <div className="text-xs text-sky-500">lotes</div>
                        </div>
                        <div className="h-8 w-px bg-sky-800" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-300">
                                {totalGeral.toLocaleString('pt-BR')}
                            </div>
                            <div className="text-xs text-indigo-500">leads frios</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowScheduler((prev) => !prev)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            {showScheduler ? 'Fechar agenda' : 'Agendar envios'}
                        </button>
                        <button
                            onClick={onRefresh}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Atualizar
                        </button>
                        <button
                            onClick={onEnviarTodos}
                            disabled={isSending || isDeleting}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900/50 disabled:text-sky-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            {isSending
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Send className="w-3.5 h-3.5" />
                            }
                            Enviar todos os lotes ao funil
                        </button>
                    </div>
                </div>
            </div>

            {showScheduler && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                                    Data de inicio
                                </label>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    min={getTodayInputDate()}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                                    Dias permitidos para envio
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {WEEK_DAYS.map((day) => {
                                        const ativo = diasSemanaSelecionados.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleDiaSemana(day.value)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${ativo
                                                    ? 'bg-sky-600 border-sky-500 text-white'
                                                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-sm text-gray-300">
                                {plano.length} lote(s) serao distribuidos
                            </p>
                            <p className="text-xs text-gray-500">
                                Um lote por dia util selecionado
                            </p>
                            <button
                                onClick={handleSalvarAgendamento}
                                disabled={isScheduling || plano.length === 0}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/40 disabled:text-emerald-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                                Salvar programacao
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                            Preview da agenda
                        </p>
                        {plano.length === 0 ? (
                            <p className="text-sm text-gray-500">Selecione uma data inicial e ao menos um dia da semana.</p>
                        ) : (
                            <div className="max-h-56 overflow-y-auto space-y-1.5">
                                {plano.map((item, index) => (
                                    <div
                                        key={`${item.lote}-${item.dataEnvio}`}
                                        className="flex items-center justify-between text-sm rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
                                    >
                                        <span className="text-gray-200 truncate pr-2">{index + 1}. {item.lote}</span>
                                        <span className="text-sky-300 font-medium whitespace-nowrap">{formatSimpleDate(item.dataEnvio)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                            Agendamentos ativos
                        </p>

                        {loadingAgendamentos ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Carregando agendamentos...
                            </div>
                        ) : agendamentosOrdenados.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhum envio agendado no momento.</p>
                        ) : (
                            <div className="max-h-64 overflow-y-auto space-y-1.5">
                                {agendamentosOrdenados.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-2 rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-100 truncate">
                                                {item.lote ?? '(sem lote)'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Envio em {formatSimpleDate(item.dataEnvio)}
                                            </p>
                                            {item.status === 'erro' && item.erro && (
                                                <p className="text-xs text-red-400 truncate" title={item.erro}>
                                                    {item.erro}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <StatusBadge status={item.status} />
                                            {item.status !== 'processado' && item.status !== 'cancelado' && (
                                                <button
                                                    onClick={() => onCancelarAgendamento(item.id)}
                                                    disabled={cancellingScheduleId === item.id}
                                                    className="p-1.5 rounded-md border border-red-700/70 text-red-300 hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Cancelar agendamento"
                                                >
                                                    {cancellingScheduleId === item.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <Trash2 className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {lotes.map((lote) => (
                <LoteCard
                    key={lote.lote}
                    lote={lote}
                    isSending={isSending}
                    isDeleting={isDeleting}
                    onEnviarLote={onEnviarLote}
                    onExcluirLote={onExcluirLote}
                />
            ))}
        </div>
    );
}

