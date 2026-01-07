/**
 * API Route: Listar cidades de um estado
 * Endpoint: /api/leads/cidades/[estado]
 */
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

export async function GET(
    request: NextRequest,
    { params }: { params: { estado: string } }
) {
    try {
        const estado = params.estado;

        if (!estado) {
            return NextResponse.json(
                { error: 'Estado não fornecido' },
                { status: 400 }
            );
        }

        const response = await fetch(`${PYTHON_API_URL}/cidades/${estado}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Cache por 1 hora
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: `Erro ao buscar cidades do estado ${estado}`,
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro na API /api/leads/cidades/[estado]:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar cidades',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
