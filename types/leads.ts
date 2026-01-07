/**
 * Tipos para sistema de busca de leads dos arquivos .parquet
 */

// Dados de uma empresa do arquivo .parquet
export interface EmpresaParquet {
    'CNPJ BASICO': string;
    'CNPJ ORDEM': string;
    'CNPJ DV': string;
    'MATRIZ/FILIAL': string;
    'RAZAO SOCIAL / NOME EMPRESARIAL': string;
    'NOME FANTASIA': string;
    'CAPITAL SOCIAL': string;
    'PORTE DA EMPRESA': string;
    'QUALIFICACAO DO PROFISSIONAL': string;
    'NATUREZA JURIDICA': string;
    'SITUAÇÃO CADASTRAL': string;
    'DATA DA SITUAÇÃO CADASTRAL': string;
    'MOTIVO DA SITUAÇÃO CADASTRAL': string;
    'CIDADE NO EXTERIOR': string;
    PAIS: string;
    'DATA DE INÍCIO DE ATIVIDADE': string;
    'ATIVIDADE PRINCIPAL': string;
    'COD ATIVIDADE PRINCIPAL': string;
    'COD ATIVIDADES SECUNDARIAS': string;
    'TIPO DE LOGRADOURO': string;
    LOGRADOURO: string;
    NUMERO: string;
    COMPLEMENTO: string;
    BAIRRO: string;
    CEP: string;
    UF: string;
    MUNICIPIO: string;
    'TELEFONE 1': string;
    'TELEFONE 2': string;
    FAX: string;
    'CORREIO ELETRONICO': string;
    'ENTE FEDERATIVO RESPONSAVEL': string;
    'SITUAÇÃO ESPECIAL': string;
    'DATA DA SITUAÇÃO ESPECIAL': string;
    'MEI?': string;
    'DATA ENTRADA MEI': number | null;
    'DATA EXCLUSAO MEI': number | null;
    'SIMPLES?': string;
    'DATA ENTRADA SIMPLES': number | null;
    'DATA EXCLUSAO SIMPLES': number | null;
    CNPJ: string | null;
}

// Filtros de busca
export interface LeadsSearchFilters {
    estado?: string;
    cidade?: string;
    cnae?: string;
    situacao?: string;
    porte?: string;
    limit?: number;
}

// Resposta da API de busca
export interface LeadsSearchResponse {
    total_encontrado: number;
    total_lidos: number;
    filtros: {
        estado: string;
        cidade?: string;
        cnae?: string;
        situacao?: string;
        porte?: string;
    };
    resultados: EmpresaParquet[];
}

// Estado disponível
export interface Estado {
    sigla: string;
    total_cidades: number;
}

// Cidade disponível
export interface Cidade {
    nome: string;
    arquivo: string;
    tamanho_kb: number;
}

// Response de estados
export interface EstadosResponse {
    total: number;
    estados: Estado[];
}

// Response de cidades
export interface CidadesResponse {
    estado: string;
    total: number;
    cidades: Cidade[];
}

// Health check response
export interface HealthResponse {
    status: 'healthy' | 'error';
    dados_path?: string;
    total_estados?: number;
    sample_parquet_files?: number;
    message?: string;
}
