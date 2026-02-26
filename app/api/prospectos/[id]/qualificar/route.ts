export const dynamic = 'force-dynamic'

/**
 * API para qualificar prospecto (apenas alterar status para qualificado)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/prospectos/[id]/qualificar
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Buscar prospecto
        const prospecto = await prisma.prospecto.findFirst({
            where: { id, userId }
        });

        if (!prospecto) {
            return NextResponse.json(
                { error: 'Prospecto não encontrado' },
                { status: 404 }
            );
        }

        // Apenas atualizar status para qualificado
        const updated = await prisma.prospecto.update({
            where: { id },
            data: {
                status: 'qualificado'
            }
        });

        return NextResponse.json({
            success: true,
            prospecto: updated,
            mensagem: 'Prospecto qualificado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao qualificar prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao qualificar prospecto' },
            { status: 500 }
        );
    }
}
