export const dynamic = 'force-dynamic'

/**
 * API para listagem e criação de prospectos
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

function parseLimit(value: string | null, fallback = 20, max = 50) {
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(1, parsed));
}

function parseOffset(value: string | null) {
    if (!value) return 0;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return 0;
    return Math.max(0, parsed);
}

// GET /api/prospectos - Lista todos os prospectos com filtros
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const uf = searchParams.get('uf');
        const municipio = searchParams.get('municipio');
        const prioridade = searchParams.get('prioridade');
        const lote = searchParams.get('lote');
        const limit = parseLimit(searchParams.get('limit'));
        const offset = parseOffset(searchParams.get('offset'));

        // Construir filtros
        const where: Record<string, unknown> = { userId };
        const origem = searchParams.get('origem'); // 'leads' = mostrar apenas lead_frio

        // Se nenhum status específico for solicitado:
        // - origem=leads → leads frios + novos sem contato (aba Leads, retrocompatível)
        // - sem origem → excluir lead_frio e convertido (funil normal)
        if (status) {
            where.status = status;
        } else if (origem === 'leads') {
            // Aba Leads: mostrar lead_frio E novo sem ultimoContato (nunca contatados)
            where.OR = [
                { status: 'lead_frio' },
                { status: 'novo', ultimoContato: null },
            ];
            delete where.status;
        } else {
            // Funil: exclui lead_frio, convertidos, E novo sem contato (que estão na aba Leads)
            where.AND = [
                { status: { notIn: ['convertido', 'lead_frio'] } },
                { NOT: { status: 'novo', ultimoContato: null } },
            ];
            delete where.status;
        }

        if (uf) where.uf = uf;
        if (municipio) where.municipio = { contains: municipio };
        if (prioridade) {
            const prioridadeParsed = Number(prioridade);
            if (!Number.isInteger(prioridadeParsed)) {
                return NextResponse.json(
                    { error: 'Prioridade invalida' },
                    { status: 400 }
                );
            }
            where.prioridade = prioridadeParsed;
        }
        if (lote) where.lote = lote;

        // Buscar prospectos
        const [prospectos, total] = await Promise.all([
            prisma.prospecto.findMany({
                where,
                orderBy: [
                    { prioridade: 'desc' },
                    { dataImportacao: 'desc' }
                ],
                take: limit,
                skip: offset,
            }),
            prisma.prospecto.count({ where })
        ]);

        // Buscar lotes unicos com SQL parametrizado (evita SQL injection).
        let lotes: string[] = [];
        try {
            const statusClause = origem === 'leads'
                ? Prisma.sql`AND (status = 'lead_frio' OR (status = 'novo' AND "ultimoContato" IS NULL))`
                : Prisma.sql`AND status NOT IN ('convertido', 'lead_frio')`;
            const lotesResult = await prisma.$queryRaw<{ lote: string | null }[]>(
                Prisma.sql`
                    SELECT DISTINCT lote
                    FROM prospectos
                    WHERE lote IS NOT NULL
                    ${statusClause}
                    AND "userId" = ${userId}
                    ORDER BY lote ASC
                `
            );
            lotes = lotesResult.map(l => l.lote).filter((l): l is string => l !== null);
        } catch {
            // Campo lote pode não existir ainda se o DB não foi migrado
            lotes = [];
        }

        // Estatísticas por status - usando countBy separado para evitar limitações do groupBy com OR/AND
        let stats = {
            total,
            lead_frio: 0,
            novo: 0,
            em_contato: 0,
            qualificado: 0,
            descartado: 0,
            convertido: 0,
            lotes,
        };

        if (origem === 'leads') {
            // Na aba Leads: contar lead_frio + novo sem contato e somar em lead_frio
            const [countLeadFrio, countNovos] = await Promise.all([
                prisma.prospecto.count({ where: { userId, status: 'lead_frio' } }),
                prisma.prospecto.count({ where: { userId, status: 'novo', ultimoContato: null } }),
            ]);
            stats.lead_frio = countLeadFrio + countNovos;
        } else {
            // No funil: groupBy normal pelos status disponíveis
            const grupoPorStatus = await prisma.prospecto.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            });
            grupoPorStatus.forEach((e: { status: string; _count: { status: number } }) => {
                const key = e.status as keyof typeof stats;
                if (key in stats && typeof stats[key] === 'number') {
                    (stats as Record<string, number | string[]>)[key] = e._count.status;
                }
            });
        }


        return NextResponse.json({
            prospectos,
            estatisticas: stats,
            paginacao: {
                total,
                limit,
                offset,
            }
        });
    } catch (error) {
        console.error('Erro ao buscar prospectos:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar prospectos' },
            { status: 500 }
        );
    }
}

// POST /api/prospectos - Cria um novo prospecto
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Verificar se CNPJ já existe
        const existente = await prisma.prospecto.findUnique({
            where: { userId_cnpj: { userId, cnpj: body.cnpj } }
        });

        if (existente) {
            return NextResponse.json(
                { error: 'CNPJ já cadastrado', prospecto: existente },
                { status: 409 }
            );
        }

        const prospecto = await prisma.prospecto.create({
            data: {
                ...body,
                userId
            }
        });

        return NextResponse.json(prospecto, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao criar prospecto' },
            { status: 500 }
        );
    }
}

