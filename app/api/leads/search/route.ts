/**
 * API Route: Bridge entre Next.js e Backend Python (FastAPI)
 * Endpoint: /api/leads/search
 */
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
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
        const limit = searchParams.get('limit') || '100';

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
        queryParams.append('limit', limit);

        // Chamar backend Python
        const response = await fetch(
            `${PYTHON_API_URL}/search?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Timeout de 30 segundos
                signal: AbortSignal.timeout(30000),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erro ao buscar dados do backend Python',
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro na API /api/leads/search:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Timeout ao buscar dados. Tente com filtros mais específicos.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
