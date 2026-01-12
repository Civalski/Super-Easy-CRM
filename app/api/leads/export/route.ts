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
