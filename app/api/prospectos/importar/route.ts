/**
 * API para importação em lote de prospectos do arquivo .parquet
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { EmpresaParquet } from '@/types/leads';

interface ImportResult {
    importados: number;
    duplicados: number;
    erros: string[];
}

// Função para montar CNPJ completo
function montarCNPJ(empresa: EmpresaParquet): string {
    const basico = empresa['CNPJ BASICO'] || '';
    const ordem = empresa['CNPJ ORDEM'] || '';
    const dv = empresa['CNPJ DV'] || '';

    // Padronizar com zeros à esquerda
    const basicoPad = basico.padStart(8, '0');
    const ordemPad = ordem.padStart(4, '0');
    const dvPad = dv.padStart(2, '0');

    return `${basicoPad}${ordemPad}${dvPad}`;
}

// Função para mapear dados do .parquet para o modelo Prospecto
function mapearEmpresaParaProspecto(empresa: EmpresaParquet) {
    const cnpj = montarCNPJ(empresa);

    return {
        cnpj,
        cnpjBasico: empresa['CNPJ BASICO'] || '',
        cnpjOrdem: empresa['CNPJ ORDEM'] || '',
        cnpjDv: empresa['CNPJ DV'] || '',
        razaoSocial: empresa['RAZAO SOCIAL / NOME EMPRESARIAL'] || 'Não informado',
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
        municipio: empresa.MUNICIPIO || 'Não informado',
        uf: empresa.UF || 'XX',
        telefone1: empresa['TELEFONE 1'] || null,
        telefone2: empresa['TELEFONE 2'] || null,
        fax: empresa.FAX || null,
        email: empresa['CORREIO ELETRONICO'] || null,
        status: 'novo',
        prioridade: 0,
    };
}

// POST /api/prospectos/importar - Importa múltiplas empresas
export async function POST(request: NextRequest) {
    try {
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

        // Buscar CNPJs já existentes para evitar duplicatas
        const cnpjsParaImportar = empresas.map(e => montarCNPJ(e));
        const existentes = await prisma.prospecto.findMany({
            where: {
                cnpj: { in: cnpjsParaImportar }
            },
            select: { cnpj: true }
        });
        const cnpjsExistentes = new Set(existentes.map(e => e.cnpj));

        // Processar cada empresa
        const prospectosCriar = [];

        for (const empresa of empresas) {
            try {
                const cnpj = montarCNPJ(empresa);

                if (cnpjsExistentes.has(cnpj)) {
                    result.duplicados++;
                    continue;
                }

                const dadosProspecto = mapearEmpresaParaProspecto(empresa);
                prospectosCriar.push(dadosProspecto);

            } catch (err) {
                result.erros.push(`Erro ao processar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            }
        }

        // Inserir em lote
        if (prospectosCriar.length > 0) {
            const criados = await prisma.prospecto.createMany({
                data: prospectosCriar,
                // Nota: SQLite não suporta skipDuplicates - verificação já feita acima
            });
            result.importados = criados.count;
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
