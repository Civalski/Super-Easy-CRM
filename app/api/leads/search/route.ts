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
        const cnae_principal = searchParams.get('cnae_principal');
        const cnae_secundario = searchParams.get('cnae_secundario');
        const exigir_secundario = searchParams.get('exigir_secundario') === 'true';
        const qualquer_secundario = searchParams.get('qualquer_secundario') === 'true';
        const situacao = searchParams.get('situacao');
        const porte = searchParams.get('porte');
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
        if (cnae_principal) queryParams.append('cnae_principal', cnae_principal);
        if (cnae_secundario) queryParams.append('cnae_secundario', cnae_secundario);
        if (exigir_secundario) queryParams.append('exigir_secundario', 'true');
        if (qualquer_secundario) queryParams.append('qualquer_secundario', 'true');
        if (situacao) queryParams.append('situacao', situacao);
        if (porte) queryParams.append('porte', porte);
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
