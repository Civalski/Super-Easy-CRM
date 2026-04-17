export const dynamic = 'force-dynamic'

/**
 * API para importacao em lote de prospectos do arquivo .parquet
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/route-helpers';
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit';
import { heavyRoutesDisabledResponse, isHeavyRoutesDisabled } from '@/lib/security/heavy-routes';
import type { EmpresaParquet } from '@/types/leads';

interface ImportResult {
    importados: number;
    duplicados: number;
    erros: string[];
}

const MAX_IMPORT_EMPRESAS = 500;
const MAX_IMPORT_BODY_BYTES = 2 * 1024 * 1024;
const importRateLimitConfig = {
    windowMs: 60 * 1000,
    maxAttempts: 2,
    blockDurationMs: 60 * 1000,
};

/**
 * Colunas permitidas na importacao CSV. O restante do arquivo e ignorado.
 * Variacoes de cabecalho (lowercase) -> chave canonica
 */
const COLUNAS_PERMITIDAS: Record<string, string> = {
    cnpj: 'CNPJ',
    'matriz/filial': 'MATRIZ/FILIAL',
    'razao social': 'RAZAO SOCIAL / NOME EMPRESARIAL',
    'razao social / nome empresarial': 'RAZAO SOCIAL / NOME EMPRESARIAL',
    'nome fantasia': 'NOME FANTASIA',
    'capital social': 'CAPITAL SOCIAL',
    'porte da empresa': 'PORTE DA EMPRESA',
    'qualificacao do profissional': 'QUALIFICACAO DO PROFISSIONAL',
    'natureza juridica': 'NATUREZA JURIDICA',
    'situação cadastral': 'SITUAÇÃO CADASTRAL',
    'situacao cadastral': 'SITUAÇÃO CADASTRAL',
    'data da situação cadastral': 'DATA DA SITUAÇÃO CADASTRAL',
    'data da situacao cadastral': 'DATA DA SITUAÇÃO CADASTRAL',
    'motivo da situação cadastral': 'MOTIVO DA SITUAÇÃO CADASTRAL',
    'motivo da situacao cadastral': 'MOTIVO DA SITUAÇÃO CADASTRAL',
    'data de início de atividade': 'DATA DE INÍCIO DE ATIVIDADE',
    'data de inicio de atividade': 'DATA DE INÍCIO DE ATIVIDADE',
    'atividade principal': 'ATIVIDADE PRINCIPAL',
    'cod atividade principal': 'COD ATIVIDADE PRINCIPAL',
    'cod atividades secundarias': 'COD ATIVIDADES SECUNDARIAS',
    logradouro: 'LOGRADOURO',
    numero: 'NUMERO',
    complemento: 'COMPLEMENTO',
    bairro: 'BAIRRO',
    cep: 'CEP',
    uf: 'UF',
    municipio: 'MUNICIPIO',
    'telefone 1': 'TELEFONE 1',
    telefone: 'TELEFONE 1',
    'telefone 2': 'TELEFONE 2',
    'correio eletronico': 'CORREIO ELETRONICO',
    email: 'CORREIO ELETRONICO',
    'mei?': 'MEI?',
    mei: 'MEI?',
    'data entrada mei': 'DATA ENTRADA MEI',
    'simples?': 'SIMPLES?',
    simples: 'SIMPLES?',
};

/** Normaliza linha do CSV: so considera colunas permitidas, ignora o restante */
function normalizarRowFromCsv(row: Record<string, unknown>): EmpresaParquet {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        const keyNorm = String(key).trim().toLowerCase().replace(/\s+/g, ' ');
        const mapped = COLUNAS_PERMITIDAS[keyNorm];
        if (mapped) {
            normalized[mapped] = value;
        }
    }
    return normalized as unknown as EmpresaParquet;
}

// Funcao para montar CNPJ completo
function montarCNPJ(empresa: EmpresaParquet): string {
    const cnpjVal = empresa.CNPJ;
    if (cnpjVal && String(cnpjVal).replace(/\D/g, '').length >= 14) {
        return String(cnpjVal).replace(/\D/g, '').padStart(14, '0');
    }

    const basico = String(empresa['CNPJ BASICO'] ?? '').trim();
    const ordem = String(empresa['CNPJ ORDEM'] ?? '').trim();
    const dv = String(empresa['CNPJ DV'] ?? '').trim();

    if (basico || ordem || dv) {
        const basicoPad = basico.padStart(8, '0');
        const ordemPad = ordem.padStart(4, '0');
        const dvPad = dv.padStart(2, '0');
        return `${basicoPad}${ordemPad}${dvPad}`;
    }

    return '';
}

// Funcao para mapear dados do .parquet para o modelo Prospecto
function mapearEmpresaParaProspecto(empresa: EmpresaParquet) {
    const cnpj = montarCNPJ(empresa);

    /**
     * Mapeamento de campos
     * Chaves compatíveis com o formato do arquivo .csv de exemplo e .parquet
     */
    return {
        cnpj,
        cnpjBasico: empresa['CNPJ BASICO'] || cnpj.substring(0, 8),
        cnpjOrdem: empresa['CNPJ ORDEM'] || cnpj.substring(8, 12),
        cnpjDv: empresa['CNPJ DV'] || cnpj.substring(12, 14),
        razaoSocial: empresa['RAZAO SOCIAL / NOME EMPRESARIAL'] || 'Nao informado',
        nomeFantasia: empresa['NOME FANTASIA'] || null,
        capitalSocial: empresa['CAPITAL SOCIAL'] || null,
        porte: empresa['PORTE DA EMPRESA'] || null,
        naturezaJuridica: empresa['NATUREZA JURIDICA'] || null,
        situacaoCadastral: empresa['SITUAÇÃO CADASTRAL'] || null,
        dataAbertura: empresa['DATA DE INÍCIO DE ATIVIDADE'] || null,
        matrizFilial: empresa['MATRIZ/FILIAL'] || null,
        cnaePrincipal: empresa['COD ATIVIDADE PRINCIPAL'] || null,
        cnaePrincipalDesc: empresa['ATIVIDADE PRINCIPAL'] || null,
        cnaesSecundarios: empresa['COD ATIVIDADES SECUNDARIAS'] || null,
        tipoLogradouro: empresa['TIPO DE LOGRADOURO'] || null,
        logradouro: empresa.LOGRADOURO || null,
        numero: empresa.NUMERO || null,
        complemento: empresa.COMPLEMENTO || null,
        bairro: empresa.BAIRRO || null,
        cep: empresa.CEP || null,
        municipio: empresa.MUNICIPIO || 'Nao informado',
        uf: empresa.UF || 'XX',
        telefone1: empresa['TELEFONE 1'] || null,
        telefone2: empresa['TELEFONE 2'] || null,
        fax: empresa.FAX || null,
        email: empresa['CORREIO ELETRONICO'] || null,
        status: 'lead_frio',
        prioridade: 0,
    };
}

// POST /api/prospectos/importar - Importa multiplas empresas
export async function POST(request: NextRequest) {
    return withAuth(request, async (userId) => {
        try {
            if (isHeavyRoutesDisabled()) {
                return heavyRoutesDisabledResponse();
            }

            const rateLimitResponse = await enforceApiRateLimit({
                key: `api:prospectos:importar:user:${userId}`,
                config: importRateLimitConfig,
                error: 'Muitas importacoes em pouco tempo. Aguarde um minuto.',
            });
            if (rateLimitResponse) {
                return rateLimitResponse;
            }

            const contentLength = Number(request.headers.get('content-length') ?? '0');
            if (Number.isFinite(contentLength) && contentLength > MAX_IMPORT_BODY_BYTES) {
                return NextResponse.json(
                    { error: 'Payload muito grande para importacao (maximo 2MB)' },
                    { status: 413 }
                );
            }

            const body = await request.json();
            const empresas: EmpresaParquet[] = body.empresas || [];
            const fileName = body.fileName || 'Importacao';

            console.info('[prospectos/importar] solicitacao recebida', {
                userId,
                fileName,
                empresasCount: Array.isArray(empresas) ? empresas.length : 0,
            });

            if (!Array.isArray(empresas) || empresas.length === 0) {
                return NextResponse.json(
                    { error: 'Nenhuma empresa para importar' },
                    { status: 400 }
                );
            }

            if (empresas.length > MAX_IMPORT_EMPRESAS) {
                return NextResponse.json(
                    { error: `Limite de ${MAX_IMPORT_EMPRESAS} empresas por importacao` },
                    { status: 400 }
                );
            }

            const result: ImportResult = {
                importados: 0,
                duplicados: 0,
                erros: []
            };

            const prospectosMap = new Map<string, ReturnType<typeof mapearEmpresaParaProspecto>>();
            let duplicadosNoPayload = 0;
            const importId = Date.now();

            for (let i = 0; i < empresas.length; i++) {
                try {
                    const row = empresas[i] as unknown as Record<string, unknown>;
                    const empresa = normalizarRowFromCsv(row);
                    let cnpj = montarCNPJ(empresa);

                    // CSV sem coluna CNPJ: gera chave unica para nao colapsar todos em 1
                    if (!cnpj || cnpj === '00000000000000') {
                        cnpj = `IMPORT-${importId}-${i}`;
                        (empresa as unknown as Record<string, unknown>).CNPJ = cnpj;
                    }

                    if (prospectosMap.has(cnpj)) {
                        duplicadosNoPayload++;
                        continue;
                    }

                    const dadosProspecto = mapearEmpresaParaProspecto(empresa);
                    // Garante cnpj correto quando foi sintetico
                    dadosProspecto.cnpj = cnpj;
                    prospectosMap.set(cnpj, dadosProspecto);
                } catch (err) {
                    result.erros.push(`Erro ao processar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                }
            }

            const prospectosCriar = Array.from(prospectosMap.values()).map((prospecto) => ({
                ...prospecto,
                userId,
                lote: null,
            }));

            if (prospectosCriar.length > 0) {
                const criados = await prisma.prospecto.createMany({
                    data: prospectosCriar,
                    skipDuplicates: true,
                });
                result.importados = criados.count;
                const duplicadosNoBanco = prospectosCriar.length - criados.count;
                result.duplicados = duplicadosNoPayload + duplicadosNoBanco;
            } else {
                result.duplicados = duplicadosNoPayload;
            }

            return NextResponse.json({
                success: true,
                ...result,
                mensagem: `${result.importados} prospecto(s) importado(s), ${result.duplicados} duplicado(s) ignorado(s)`
            });

        } catch (error) {
            console.error('Erro ao importar prospectos:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            return NextResponse.json(
                { error: 'Erro ao importar prospectos' },
                { status: 500 }
            );
        }
    });
}
