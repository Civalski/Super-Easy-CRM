/**
 * API para operações em um prospecto específico
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/prospectos/[id] - Busca prospecto por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const prospecto = await prisma.prospecto.findUnique({
            where: { id },
            include: {
                cliente: true
            }
        });

        if (!prospecto) {
            return NextResponse.json(
                { error: 'Prospecto não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(prospecto);
    } catch (error) {
        console.error('Erro ao buscar prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar prospecto' },
            { status: 500 }
        );
    }
}

// PUT /api/prospectos/[id] - Atualiza prospecto
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Campos permitidos para atualização
        const { status, observacoes, prioridade, ultimoContato } = body;

        const prospecto = await prisma.prospecto.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(observacoes !== undefined && { observacoes }),
                ...(prioridade !== undefined && { prioridade }),
                ...(ultimoContato && { ultimoContato: new Date(ultimoContato) }),
            }
        });

        return NextResponse.json(prospecto);
    } catch (error) {
        console.error('Erro ao atualizar prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar prospecto' },
            { status: 500 }
        );
    }
}

// DELETE /api/prospectos/[id] - Remove prospecto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await prisma.prospecto.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao remover prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao remover prospecto' },
            { status: 500 }
        );
    }
}
