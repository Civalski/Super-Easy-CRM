/**
 * API Route: Exporta todos os leads para a aba Prospectar
 * Endpoint: /api/leads/export-prospectar
 * 
 * Busca os leads do backend Python e importa diretamente como prospectos no banco
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

// Função para montar CNPJ completo a partir dos dados
function montarCNPJ(basico: string, ordem: string, dv: string): string {
    const basicoPad = (basico || '').padStart(8, '0');
    const ordemPad = (ordem || '').padStart(4, '0');
    const dvPad = (dv || '').padStart(2, '0');
    return `${basicoPad}${ordemPad}${dvPad}`;
}

// Interface para mapear dados do Python para o formato esperado
interface EmpresaCSV {
    'CNPJ BASICO': string;
    'CNPJ ORDEM': string;
    'CNPJ DV': string;
    'MATRIZ/FILIAL': string;
    'RAZAO SOCIAL / NOME EMPRESARIAL': string;
    'NOME FANTASIA': string;
    'CAPITAL SOCIAL': string;
    'PORTE DA EMPRESA': string;
    'NATUREZA JURIDICA': string;
    'SITUAÇÃO CADASTRAL': string;
    'DATA DE INÍCIO DE ATIVIDADE': string;
    'COD ATIVIDADE PRINCIPAL': string;
    'ATIVIDADE PRINCIPAL': string;
    'COD ATIVIDADES SECUNDARIAS': string;
    'TIPO DE LOGRADOURO': string;
    'LOGRADOURO': string;
    'NUMERO': string;
    'COMPLEMENTO': string;
    'BAIRRO': string;
    'CEP': string;
    'UF': string;
    'MUNICIPIO': string;
    'TELEFONE 1': string;
    'TELEFONE 2': string;
    'FAX': string;
    'CORREIO ELETRONICO': string;
    [key: string]: string;
}

// Função para parsear CSV
function parseCSV(csvText: string): EmpresaCSV[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const results: EmpresaCSV[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row: { [key: string]: string } = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            results.push(row as EmpresaCSV);
        }
    }

    return results;
}

// Função auxiliar para parsear uma linha CSV respeitando aspas
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Pula a próxima aspa
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

// Função para gerar identificação do lote (A, B, C... Z, A1, B1... Z1, A2...)
function gerarIdentificadorLote(indice: number): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letraIndice = indice % 26;
    const rodada = Math.floor(indice / 26);

    if (rodada === 0) {
        return letras[letraIndice];
    }
    return `${letras[letraIndice]}${rodada}`;
}

// Função para mapear empresa do CSV para dados do prospecto
function mapearEmpresaParaProspecto(empresa: EmpresaCSV, lote?: string) {
    const cnpj = montarCNPJ(
        empresa['CNPJ BASICO'],
        empresa['CNPJ ORDEM'],
        empresa['CNPJ DV']
    );

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
        logradouro: empresa['LOGRADOURO'] || null,
        numero: empresa['NUMERO'] || null,
        complemento: empresa['COMPLEMENTO'] || null,
        bairro: empresa['BAIRRO'] || null,
        cep: empresa['CEP'] || null,
        municipio: empresa['MUNICIPIO'] || 'Não informado',
        uf: empresa['UF'] || 'XX',
        telefone1: empresa['TELEFONE 1'] || null,
        telefone2: empresa['TELEFONE 2'] || null,
        fax: empresa['FAX'] || null,
        email: empresa['CORREIO ELETRONICO'] || null,
        status: 'novo',
        prioridade: 0,
        lote: lote || null,
    };
}

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Construir query string para o backend Python
        const queryParams = new URLSearchParams();

        const estado = searchParams.get('estado');
        const cidade = searchParams.get('cidade');
        const cnaes_principais = searchParams.get('cnaes_principais');
        const cnaes_secundarios = searchParams.get('cnaes_secundarios');
        const exigir_todos_secundarios = searchParams.get('exigir_todos_secundarios') === 'true';
        const filtrar_telefones_invalidos = searchParams.get('filtrar_telefones_invalidos') === 'true';
        const adicionar_nono_digito = searchParams.get('adicionar_nono_digito') === 'true';
        const apenas_celular = searchParams.get('apenas_celular') === 'true';
        const situacao = searchParams.get('situacao');
        const porte = searchParams.get('porte');
        const capital_min = searchParams.get('capital_min');
        const capital_max = searchParams.get('capital_max');
        const ano_inicio_min = searchParams.get('ano_inicio_min');
        const ano_inicio_max = searchParams.get('ano_inicio_max');
        const mes_inicio = searchParams.get('mes_inicio');
        const bairros = searchParams.get('bairros');
        const tamanho_lote = searchParams.get('tamanho_lote'); // Tamanho do lote (ex: 30)

        // Validar parâmetros obrigatórios
        if (!estado) {
            return NextResponse.json(
                { error: 'Parâmetro "estado" é obrigatório' },
                { status: 400 }
            );
        }

        queryParams.append('estado', estado);
        if (cidade) queryParams.append('cidade', cidade);
        if (cnaes_principais) queryParams.append('cnaes_principais', cnaes_principais);
        if (cnaes_secundarios) queryParams.append('cnaes_secundarios', cnaes_secundarios);
        if (exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
        if (filtrar_telefones_invalidos) queryParams.append('filtrar_telefones_invalidos', 'true');
        if (adicionar_nono_digito) queryParams.append('adicionar_nono_digito', 'true');
        if (apenas_celular) queryParams.append('apenas_celular', 'true');
        if (situacao) queryParams.append('situacao', situacao);
        if (porte) queryParams.append('porte', porte);
        if (capital_min) queryParams.append('capital_min', capital_min);
        if (capital_max) queryParams.append('capital_max', capital_max);
        if (ano_inicio_min) queryParams.append('ano_inicio_min', ano_inicio_min);
        if (ano_inicio_max) queryParams.append('ano_inicio_max', ano_inicio_max);
        if (mes_inicio) queryParams.append('mes_inicio', mes_inicio);
        if (bairros) queryParams.append('bairros', bairros);

        // Buscar dados do backend Python
        const response = await fetch(
            `${PYTHON_API_URL}/export?${queryParams.toString()}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erro ao buscar leads do backend Python',
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        // Ler o CSV completo
        const csvText = await response.text();
        const empresas = parseCSV(csvText);

        if (empresas.length === 0) {
            return NextResponse.json({
                success: true,
                importados: 0,
                duplicados: 0,
                erros: [],
                mensagem: 'Nenhuma empresa para importar'
            });
        }

        // Buscar CNPJs já existentes para evitar duplicatas
        const cnpjsParaImportar = empresas.map(e =>
            montarCNPJ(e['CNPJ BASICO'], e['CNPJ ORDEM'], e['CNPJ DV'])
        );

        // Buscar em lotes para evitar problemas com muitos CNPJs
        const BATCH_SIZE = 1000;
        const cnpjsExistentes = new Set<string>();

        for (let i = 0; i < cnpjsParaImportar.length; i += BATCH_SIZE) {
            const batch = cnpjsParaImportar.slice(i, i + BATCH_SIZE);
            const existentes = await prisma.prospecto.findMany({
                where: { cnpj: { in: batch } },
                select: { cnpj: true }
            });
            existentes.forEach(e => cnpjsExistentes.add(e.cnpj));
        }

        // Preparar dados para inserção com lotes
        const prospectosCriar: ReturnType<typeof mapearEmpresaParaProspecto>[] = [];
        let duplicados = 0;
        const erros: string[] = [];

        // Configurar lotes
        const tamLote = tamanho_lote ? parseInt(tamanho_lote) : 0; // 0 = sem lote
        let contadorLote = 0;
        let indiceLote = 0;

        for (const empresa of empresas) {
            try {
                const cnpj = montarCNPJ(
                    empresa['CNPJ BASICO'],
                    empresa['CNPJ ORDEM'],
                    empresa['CNPJ DV']
                );

                if (cnpjsExistentes.has(cnpj)) {
                    duplicados++;
                    continue;
                }

                // Marcar como existente para evitar duplicatas no mesmo lote
                cnpjsExistentes.add(cnpj);

                // Determinar lote atual
                let loteAtual: string | undefined;
                if (tamLote > 0) {
                    loteAtual = gerarIdentificadorLote(indiceLote);
                    contadorLote++;

                    // Mudar para próximo lote quando atingir o tamanho
                    if (contadorLote >= tamLote) {
                        contadorLote = 0;
                        indiceLote++;
                    }
                }

                const dadosProspecto = mapearEmpresaParaProspecto(empresa, loteAtual);
                prospectosCriar.push(dadosProspecto);

            } catch (err) {
                erros.push(`Erro ao processar empresa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            }
        }

        // Inserir em lotes para evitar timeout
        let importados = 0;
        const INSERT_BATCH_SIZE = 500;

        for (let i = 0; i < prospectosCriar.length; i += INSERT_BATCH_SIZE) {
            const batch = prospectosCriar.slice(i, i + INSERT_BATCH_SIZE);
            const criados = await prisma.prospecto.createMany({
                data: batch,
            });
            importados += criados.count;
        }

        // Calcular quantidade de lotes gerados
        const quantidadeLotes = tamLote > 0 ? indiceLote + (contadorLote > 0 ? 1 : 0) : 0;
        const lotesGerados = quantidadeLotes > 0
            ? Array.from({ length: quantidadeLotes }, (_, i) => gerarIdentificadorLote(i))
            : [];

        return NextResponse.json({
            success: true,
            importados,
            duplicados,
            totalProcessados: empresas.length,
            lotes: lotesGerados,
            tamanhoLote: tamLote || null,
            erros: erros.slice(0, 10), // Limitar erros retornados
            mensagem: tamLote > 0
                ? `${importados} prospecto(s) importado(s) em ${lotesGerados.length} lote(s), ${duplicados} duplicado(s) ignorado(s)`
                : `${importados} prospecto(s) importado(s), ${duplicados} duplicado(s) ignorado(s)`
        });

    } catch (error) {
        console.error('Erro na API /api/leads/export-prospectar:', error);

        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
