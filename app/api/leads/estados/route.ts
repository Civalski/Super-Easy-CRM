/**
 * API Route: Listar estados disponíveis
 * Endpoint: /api/leads/estados
 */
import { NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:5000';

export async function GET() {
    try {
        const response = await fetch(`${PYTHON_API_URL}/estados`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Cache por 1 hora (estados não mudam frequentemente)
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erro ao buscar estados',
                    detail: error.detail || response.statusText
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Erro na API /api/leads/estados:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar estados',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            { status: 500 }
        );
    }
}
