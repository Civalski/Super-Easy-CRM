/**
 * API Route: Bridge entre Next.js e Backend Python (FastAPI)
 * Endpoint: /api/leads/count - Conta total de leads que correspondem aos filtros
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
        const cnae_principal = searchParams.get('cnae_principal');
        const cnaes_secundarios = searchParams.get('cnaes_secundarios');
        const exigir_todos_secundarios = searchParams.get('exigir_todos_secundarios') === 'true';
        const situacao = searchParams.get('situacao');
        const porte = searchParams.get('porte');

        // Validar parâmetros obrigatórios
        if (!estado) {
            return NextResponse.json(
                { error: 'Parâmetro "estado" é obrigatório' },
                { status: 400 }
            );
        }

        queryParams.append('estado', estado);
        if (cidade) queryParams.append('cidade', cidade);
        if (cnae_principal) queryParams.append('cnae_principal', cnae_principal);
        if (cnaes_secundarios) queryParams.append('cnaes_secundarios', cnaes_secundarios);
        if (exigir_todos_secundarios) queryParams.append('exigir_todos_secundarios', 'true');
        if (situacao) queryParams.append('situacao', situacao);
        if (porte) queryParams.append('porte', porte);

        // Chamar backend Python - timeout maior para contagem completa
        const response = await fetch(
            `${PYTHON_API_URL}/count?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Timeout de 60 segundos para contagem de grandes volumes
                signal: AbortSignal.timeout(60000),
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erro ao contar leads do backend Python',
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro na API /api/leads/count:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Timeout ao contar leads. Tente com filtros mais específicos.' },
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
