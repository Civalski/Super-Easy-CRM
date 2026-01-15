/**
 * Tipos e configurações para a feature Prospectar
 */

export interface Prospecto {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    municipio: string;
    uf: string;
    telefone1: string | null;
    telefone2: string | null;
    email: string | null;
    cnaePrincipalDesc: string | null;
    porte: string | null;
    situacaoCadastral: string | null;
    status: string;
    prioridade: number;
    observacoes: string | null;
    lote: string | null;
    dataImportacao: string;
    ultimoContato: string | null;
    clienteId: string | null;
}

export interface Estatisticas {
    total: number;
    novo: number;
    em_contato: number;
    qualificado: number;
    descartado: number;
    convertido: number;
    lotes: string[];
}

export interface ProspectosResponse {
    prospectos: Prospecto[];
    estatisticas: Estatisticas;
    paginacao: {
        total: number;
        limit: number;
        offset: number;
    };
}

export const STATUS_OPTIONS = [
    { value: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'em_contato', label: 'Em Contato', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'qualificado', label: 'Qualificado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'descartado', label: 'Descartado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'convertido', label: 'Convertido', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
];

export const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
};
