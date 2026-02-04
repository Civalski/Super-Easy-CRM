/**
 * API para importacao em lote de prospectos do arquivo .parquet
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import type { EmpresaParquet } from '@/types/leads';

interface ImportResult {
    importados: number;
    duplicados: number;
    erros: string[];
}

// Funcao para montar CNPJ completo
function montarCNPJ(empresa: EmpresaParquet): string {
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

    return {
        cnpj,
        cnpjBasico: empresa['CNPJ BASICO'] || '',
        cnpjOrdem: empresa['CNPJ ORDEM'] || '',
        cnpjDv: empresa['CNPJ DV'] || '',
        razaoSocial: empresa['RAZAO SOCIAL / NOME EMPRESARIAL'] || 'Nao informado',
        nomeFantasia: empresa['NOME FANTASIA'] || null,
        capitalSocial: empresa['CAPITAL SOCIAL'] || null,
        porte: empresa['PORTE DA EMPRESA'] || null,
        naturezaJuridica: empresa['NATUREZA JURIDICA'] || null,
        situacaoCadastral: empresa['SITUAÃ‡ÃƒO CADASTRAL'] || null,
        dataAbertura: empresa['DATA DE INÃCIO DE ATIVIDADE'] || null,
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
        status: 'novo',
        prioridade: 0,
    };
}

// POST /api/prospectos/importar - Importa multiplas empresas
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const empresas: EmpresaParquet[] = body.empresas || [];

        if (!Array.isArray(empresas) || empresas.length === 0) {
            return NextResponse.json(
                { error: 'Nenhuma empresa para importar' },
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

        const prospectosCriar = Array.from(prospectosMap.values()).map((prospecto) => ({
            ...prospecto,
            userId,
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
        console.error('Erro ao importar prospectos:', error);
        return NextResponse.json(
            { error: 'Erro ao importar prospectos', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}
