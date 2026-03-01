export const dynamic = 'force-dynamic'

/**
 * API para importacao em lote de prospectos do arquivo .parquet
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthIdentityFromRequest } from '@/lib/auth';
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

// Funcao para montar CNPJ completo
function montarCNPJ(empresa: EmpresaParquet): string {
    // Se ja vier com CNPJ formatado ou apenas numeros
    if (empresa.CNPJ) {
        return empresa.CNPJ.replace(/\D/g, '').padStart(14, '0');
    }

    const basico = empresa['CNPJ BASICO'] || '';
    const ordem = empresa['CNPJ ORDEM'] || '';
    const dv = empresa['CNPJ DV'] || '';

    // Padronizar com zeros a esquerda
    const basicoPad = basico.padStart(8, '0');
    const ordemPad = ordem.padStart(4, '0');
    const dvPad = dv.padStart(2, '0');

    return `${basicoPad}${ordemPad}${dvPad}`;
}

// Funcao para mapear dados do .parquet para o modelo Prospecto
function mapearEmpresaParaProspecto(empresa: EmpresaParquet) {
    const cnpj = montarCNPJ(empresa);

    /**
     * Mapeamento de campos
     * Chaves compatíveis com o formato do arquivo .xlsx de exemplo e .parquet
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
    try {
        if (isHeavyRoutesDisabled()) {
            return heavyRoutesDisabledResponse();
        }

        const { userId, role } = await getAuthIdentityFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const rateLimitResponse = enforceApiRateLimit({
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
        const parsedBatchSize = Number(body.batchSize);
        const batchSize =
            Number.isInteger(parsedBatchSize) && parsedBatchSize >= 1 && parsedBatchSize <= 100
                ? parsedBatchSize
                : 30;
        const fileName = body.fileName || 'Importacao';

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

        for (const empresa of empresas) {
            try {
                const cnpj = montarCNPJ(empresa);

                if (prospectosMap.has(cnpj)) {
                    duplicadosNoPayload++;
                    continue;
                }

                const dadosProspecto = mapearEmpresaParaProspecto(empresa);
                prospectosMap.set(cnpj, dadosProspecto);
            } catch (err) {
                result.erros.push(`Erro ao processar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            }
        }

        // Preparar lotes
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        // Limpar extensao do arquivo para o nome do lote
        const cleanFileName = fileName.replace(/\.[^/.]+$/, "");
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        const prospectosCriar = Array.from(prospectosMap.values()).map((prospecto, index) => {
            // Calcular indice do lote (0-based)
            const batchIndex = Math.floor(index / batchSize);

            // Gerar Label: A, B, C... Z, A1, B1...
            const letter = alphabet[batchIndex % 26];
            const cycle = Math.floor(batchIndex / 26);
            const suffix = cycle > 0 ? cycle.toString() : '';
            const batchLabel = `${letter}${suffix}`;

            const loteName = `${dateStr} - ${batchLabel}`;

            return {
                ...prospecto,
                userId,
                lote: loteName
            };
        });

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
        console.error('Erro ao importar prospectos:', error);
        return NextResponse.json(
            { error: 'Erro ao importar prospectos', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}
