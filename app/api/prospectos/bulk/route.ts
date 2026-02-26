export const dynamic = 'force-dynamic'

/**
 * API para operacoes em massa de prospectos
 * DELETE /api/prospectos/bulk - Exclui multiplos prospectos
 * PATCH  /api/prospectos/bulk - Envia leads frios ao funil
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { enviarLeadsAoFunil } from '@/lib/prospectos/enviarAoFunil';

// PATCH /api/prospectos/bulk - Atualiza status em massa (ex: enviar ao funil)
export async function PATCH(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ids, lote, todos, novoStatus = 'novo' } = body;

        const atualizados = await enviarLeadsAoFunil({
            prisma,
            userId,
            filtro: { ids, lote, todos, novoStatus },
        });

        return NextResponse.json({
            success: true,
            atualizados,
            mensagem: `${atualizados} lead(s) enviado(s) ao funil com sucesso`,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Especifique ids, lote ou todos=true')) {
            return NextResponse.json(
                { error: 'Especifique ids, lote ou todos=true' },
                { status: 400 }
            );
        }

        console.error('Erro ao atualizar prospectos em massa:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar leads' },
            { status: 500 }
        );
    }
}

// DELETE /api/prospectos/bulk - Exclui todos ou por filtro
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const lote = searchParams.get('lote');
        const status = searchParams.get('status');
        const all = searchParams.get('all') === 'true';

        // Construir filtros
        const where: Record<string, any> = { userId };

        if (lote) {
            where.lote = lote;
            // Ao excluir por lote, remover leads frios de ambas as categorias:
            // - status='lead_frio' (novos imports)
            // - status='novo' + ultimoContato=null (retrocompatibilidade)
            where.OR = [
                { status: 'lead_frio' },
                { status: 'novo', ultimoContato: null },
            ];
        } else if (status && status !== 'convertido') {
            where.status = status;
        } else {
            // Nunca excluir convertidos automaticamente
            where.status = { not: 'convertido' };
        }

        // Se nao for exclusao total e nao houver filtro, requer confirmacao
        if (!all && !lote && !status) {
            return NextResponse.json(
                { error: 'Especifique um filtro (lote, status) ou use all=true para excluir todos' },
                { status: 400 }
            );
        }

        // Contar quantos serao excluidos
        const count = await prisma.prospecto.count({ where });

        if (count === 0) {
            return NextResponse.json({
                success: true,
                excluidos: 0,
                mensagem: 'Nenhum prospecto encontrado para excluir'
            });
        }

        // Excluir em uma unica transacao
        const result = await prisma.prospecto.deleteMany({ where });

        return NextResponse.json({
            success: true,
            excluidos: result.count,
            mensagem: `${result.count} prospecto(s) excluido(s) com sucesso`
        });
    } catch (error) {
        console.error('Erro ao excluir prospectos em massa:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir prospectos' },
            { status: 500 }
        );
    }
}
