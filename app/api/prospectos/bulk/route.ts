/**
 * API para exclusão em massa de prospectos
 * DELETE /api/prospectos/bulk - Exclui múltiplos prospectos
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/prospectos/bulk - Exclui todos ou por filtro
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lote = searchParams.get('lote');
        const status = searchParams.get('status');
        const all = searchParams.get('all') === 'true';

        // Construir filtros
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        // Nunca excluir convertidos automaticamente
        where.status = { not: 'convertido' };

        if (lote) {
            where.lote = lote;
        }

        if (status && status !== 'convertido') {
            where.status = status;
        }

        // Se não for exclusão total e não houver filtro, requer confirmação
        if (!all && !lote && !status) {
            return NextResponse.json(
                { error: 'Especifique um filtro (lote, status) ou use all=true para excluir todos' },
                { status: 400 }
            );
        }

        // Contar quantos serão excluídos
        const count = await prisma.prospecto.count({ where });

        if (count === 0) {
            return NextResponse.json({
                success: true,
                excluidos: 0,
                mensagem: 'Nenhum prospecto encontrado para excluir'
            });
        }

        // Excluir em uma única transação
        const result = await prisma.prospecto.deleteMany({ where });

        return NextResponse.json({
            success: true,
            excluidos: result.count,
            mensagem: `${result.count} prospecto(s) excluído(s) com sucesso`
        });
    } catch (error) {
        console.error('Erro ao excluir prospectos em massa:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir prospectos' },
            { status: 500 }
        );
    }
}
