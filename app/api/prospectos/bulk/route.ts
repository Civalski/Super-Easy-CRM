export const dynamic = 'force-dynamic'

/**
 * API para operacoes em massa de prospectos
 * DELETE /api/prospectos/bulk - Exclui multiplos prospectos
 * PATCH  /api/prospectos/bulk - Envia leads frios ao funil
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRouteContext } from '@/lib/api/route-helpers';
import { getAuthIdentityFromRequest } from '@/lib/auth';
import { enviarLeadsAoFunil } from '@/lib/prospectos/enviarAoFunil';
import { Prisma } from '@prisma/client';
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit';
import { heavyRoutesDisabledResponse, isHeavyRoutesDisabled } from '@/lib/security/heavy-routes';

const MAX_BULK_IDS = 500;
const bulkPatchRateLimitConfig = {
    windowMs: 60 * 1000,
    maxAttempts: 5,
    blockDurationMs: 60 * 1000,
};
const bulkDeleteRateLimitConfig = {
    windowMs: 60 * 1000,
    maxAttempts: 5,
    blockDurationMs: 60 * 1000,
};

// PATCH /api/prospectos/bulk - Atualiza status em massa (ex: enviar ao funil)
export async function PATCH(request: NextRequest) {
    return withRouteContext(request, async () => {
        try {
            if (isHeavyRoutesDisabled()) {
                return heavyRoutesDisabledResponse();
            }

            const { userId, role } = await getAuthIdentityFromRequest(request);
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const rateLimitResponse = enforceApiRateLimit({
                key: `api:prospectos:bulk:patch:user:${userId}`,
                config: bulkPatchRateLimitConfig,
                error: 'Muitas operacoes em massa em pouco tempo. Aguarde um minuto.',
            });
            if (rateLimitResponse) {
                return rateLimitResponse;
            }

            const body = await request.json();
            const { ids, lote, todos, novoStatus = 'novo' } = body;

            if (Array.isArray(ids) && ids.length > MAX_BULK_IDS) {
                return NextResponse.json(
                    { error: `Limite de ${MAX_BULK_IDS} IDs por operacao em massa` },
                    { status: 400 }
                );
            }

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
    });
}

// DELETE /api/prospectos/bulk - Exclui todos ou por filtro
export async function DELETE(request: NextRequest) {
    return withRouteContext(request, async () => {
        try {
            if (isHeavyRoutesDisabled()) {
                return heavyRoutesDisabledResponse();
            }

            const { userId, role } = await getAuthIdentityFromRequest(request);
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const rateLimitResponse = enforceApiRateLimit({
                key: `api:prospectos:bulk:delete:user:${userId}`,
                config: bulkDeleteRateLimitConfig,
                error: 'Muitas exclusoes em massa em pouco tempo. Aguarde um minuto.',
            });
            if (rateLimitResponse) {
                return rateLimitResponse;
            }

            const { searchParams } = new URL(request.url);
            const lote = searchParams.get('lote');
            const status = searchParams.get('status');
            const all = searchParams.get('all') === 'true';

            // Construir filtros
            const where: Prisma.ProspectoWhereInput = { userId };

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
    });
}
