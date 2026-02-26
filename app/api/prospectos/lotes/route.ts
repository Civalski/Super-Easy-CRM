/**
 * API de resumo de lotes de leads frios
 * GET /api/prospectos/lotes - Retorna lotes com contagem de leads
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar lotes com contagem de leads frios (lead_frio OU novo sem contato)
        const lotesSummary = await prisma.prospecto.groupBy({
            by: ['lote'],
            where: {
                userId,
                OR: [
                    { status: 'lead_frio' },
                    { status: 'novo', ultimoContato: null },
                ],
                lote: { not: null },
            },
            _count: { id: true },
            _max: { dataImportacao: true },
            orderBy: { _max: { dataImportacao: 'desc' } },
        });

        // Buscar total sem lote (lote null)
        const semLote = await prisma.prospecto.count({
            where: {
                userId,
                OR: [
                    { status: 'lead_frio' },
                    { status: 'novo', ultimoContato: null },
                ],
                lote: null,
            },
        });

        const lotes = lotesSummary
            .filter(l => l.lote !== null)
            .map(l => ({
                lote: l.lote as string,
                total: l._count.id,
                dataImportacao: l._max.dataImportacao,
            }));

        // Se houver leads sem lote, adicionar um grupo especial
        if (semLote > 0) {
            lotes.push({
                lote: '(sem lote)',
                total: semLote,
                dataImportacao: null,
            });
        }

        const totalGeral = lotes.reduce((acc, l) => acc + l.total, 0);

        return NextResponse.json({
            lotes,
            totalGeral,
            totalLotes: lotes.length,
        });
    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar lotes' },
            { status: 500 }
        );
    }
}
