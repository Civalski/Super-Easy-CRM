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
            // Não cachear para garantir que novos arquivos sejam detectados
            cache: 'no-store',
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
