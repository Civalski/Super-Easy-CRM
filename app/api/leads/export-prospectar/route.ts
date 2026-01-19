/**
 * API Route: Exporta todos os leads para a aba Prospectar
 * Endpoint: /api/leads/export-prospectar
 * 
 * Busca os leads do backend Python e importa diretamente como prospectos no banco
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

// Função para montar CNPJ completo a partir dos dados separados
function montarCNPJ(basico: string, ordem: string, dv: string): string {
    const basicoPad = (basico || '').padStart(8, '0');
    const ordemPad = (ordem || '').padStart(4, '0');
    const dvPad = (dv || '').padStart(2, '0');
    return `${basicoPad}${ordemPad}${dvPad}`;
}

// Função para extrair CNPJ de uma empresa (prioriza CNPJ unificado)
function extrairCNPJ(empresa: { [key: string]: string }): string {
    // Priorizar CNPJ unificado se existir (vem do backend Python)
    if (empresa['CNPJ'] && empresa['CNPJ'].trim()) {
        return empresa['CNPJ'].trim().padStart(14, '0');
    }
    // Fallback para campos separados
    return montarCNPJ(
        empresa['CNPJ BASICO'] || '',
        empresa['CNPJ ORDEM'] || '',
        empresa['CNPJ DV'] || ''
    );
}

// Interface para mapear dados do Python para o formato esperado
interface EmpresaCSV {
    'CNPJ': string;  // CNPJ unificado (quando vem do backend Python)
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
    // Normalizar quebras de linha (Windows usa \r\n, Unix usa \n, Mac antigo usa \r)
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter(line => line.trim());

    console.log(`[parseCSV] Total de linhas encontradas: ${lines.length}`);

    if (lines.length < 2) {
        console.log('[parseCSV] Menos de 2 linhas, retornando vazio');
        return [];
    }

    const headers = parseCSVLine(lines[0]);
    console.log(`[parseCSV] Headers (${headers.length}):`, headers.slice(0, 5).join(', '), '...');

    const results: EmpresaCSV[] = [];
    let skippedLines = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        // Aceitar linhas com número de valores >= headers (pode ter campos extras) 
        // ou com até 3 campos faltando (tolerância para campos opcionais no final)
        if (values.length >= headers.length - 3 && values.length <= headers.length + 5) {
            const row: { [key: string]: string } = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            results.push(row as EmpresaCSV);
        } else {
            skippedLines++;
            if (skippedLines <= 3) {
                console.log(`[parseCSV] Linha ${i} ignorada: ${values.length} valores vs ${headers.length} headers`);
            }
        }
    }

    if (skippedLines > 0) {
        console.log(`[parseCSV] ${skippedLines} linhas ignoradas por incompatibilidade de colunas`);
    }
    console.log(`[parseCSV] Total de registros parseados: ${results.length}`);

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
    // O CSV pode vir com CNPJ unificado (do Python) ou com campos separados
    // Priorizar CNPJ unificado se existir
    let cnpj: string;
    let cnpjBasico: string;
    let cnpjOrdem: string;
    let cnpjDv: string;

    if (empresa['CNPJ'] && empresa['CNPJ'].trim()) {
        // CNPJ já vem unificado do backend Python
        cnpj = empresa['CNPJ'].trim().padStart(14, '0');
        // Extrair partes do CNPJ unificado (8 + 4 + 2 = 14 dígitos)
        cnpjBasico = cnpj.substring(0, 8);
        cnpjOrdem = cnpj.substring(8, 12);
        cnpjDv = cnpj.substring(12, 14);
    } else {
        // Fallback para campos separados
        cnpjBasico = empresa['CNPJ BASICO'] || '';
        cnpjOrdem = empresa['CNPJ ORDEM'] || '';
        cnpjDv = empresa['CNPJ DV'] || '';
        cnpj = montarCNPJ(cnpjBasico, cnpjOrdem, cnpjDv);
    }

    return {
        cnpj,
        cnpjBasico,
        cnpjOrdem,
        cnpjDv,
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

        // Parâmetros de localização (novos)
        const estado = searchParams.get('estado');
        const estados = searchParams.get('estados');
        const cidade = searchParams.get('cidade');
        const cidades = searchParams.get('cidades');
        const brasil_inteiro = searchParams.get('brasil_inteiro') === 'true';

        // Outros parâmetros
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

        // Validar parâmetros de localização
        const temLocalizacao = brasil_inteiro || estado || estados || cidades;
        if (!temLocalizacao) {
            return NextResponse.json(
                { error: 'É necessário informar pelo menos: "estado", "estados", "cidades" ou "brasil_inteiro=true"' },
                { status: 400 }
            );
        }

        // Parâmetros de localização
        if (brasil_inteiro) queryParams.append('brasil_inteiro', 'true');
        if (estados) queryParams.append('estados', estados);
        if (cidades) queryParams.append('cidades', cidades);
        if (estado) queryParams.append('estado', estado);
        if (cidade) queryParams.append('cidade', cidade);

        // Outros parâmetros
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
        const cnpjsParaImportar = empresas.map(e => extrairCNPJ(e));

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
                const cnpj = extrairCNPJ(empresa);

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
