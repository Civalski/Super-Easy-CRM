/**
 * API Route: Bridge entre Next.js e Backend Python (FastAPI)
 * Endpoint: /api/leads/export - Exporta todos os leads em CSV via streaming
 */
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
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


        // Chamar backend Python - sem timeout pois pode demorar muito
        const response = await fetch(
            `${PYTHON_API_URL}/export?${queryParams.toString()}`,
            {
                method: 'GET',
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erro ao exportar leads do backend Python',
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        // Fazer streaming da resposta
        const headers = new Headers();

        // Copiar headers relevantes do backend
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            headers.set('Content-Disposition', contentDisposition);
        } else {
            headers.set('Content-Disposition', 'attachment; filename="leads_export.csv"');
        }
        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Cache-Control', 'no-cache');

        // Stream a resposta diretamente
        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Erro na API /api/leads/export:', error);

        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
