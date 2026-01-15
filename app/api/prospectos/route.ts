/**
 * API para listagem e criação de prospectos
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prospectos - Lista todos os prospectos com filtros
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const uf = searchParams.get('uf');
        const municipio = searchParams.get('municipio');
        const prioridade = searchParams.get('prioridade');
        const lote = searchParams.get('lote');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');

        // Construir filtros
        const where: Record<string, unknown> = {};

        // Se nenhum status específico for solicitado, excluir os convertidos por padrão
        // (pois prospectos convertidos já são clientes e não devem aparecer na lista de prospecção)
        if (status) {
            where.status = status;
        } else {
            where.status = { not: 'convertido' };
        }

        if (uf) where.uf = uf;
        if (municipio) where.municipio = { contains: municipio };
        if (prioridade) where.prioridade = parseInt(prioridade);
        if (lote) where.lote = lote;

        // Buscar prospectos
        const [prospectos, total] = await Promise.all([
            prisma.prospecto.findMany({
                where,
                orderBy: [
                    { prioridade: 'desc' },
                    { dataImportacao: 'desc' }
                ],
                take: limit ? parseInt(limit) : 100,
                skip: offset ? parseInt(offset) : 0,
            }),
            prisma.prospecto.count({ where })
        ]);

        // Estatísticas por status
        const estatisticas = await prisma.prospecto.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        // Buscar lotes únicos usando raw query (compatível mesmo antes do prisma generate)
        let lotes: string[] = [];
        try {
            const lotesResult = await prisma.$queryRaw<{ lote: string | null }[]>`
                SELECT DISTINCT lote FROM prospectos 
                WHERE lote IS NOT NULL AND status != 'convertido'
                ORDER BY lote ASC
            `;
            lotes = lotesResult.map(l => l.lote).filter((l): l is string => l !== null);
        } catch {
            // Campo lote pode não existir ainda se o DB não foi migrado
            lotes = [];
        }

        const stats = {
            total,
            novo: 0,
            em_contato: 0,
            qualificado: 0,
            descartado: 0,
            convertido: 0,
            lotes,
        };

        estatisticas.forEach((e: { status: string; _count: { status: number } }) => {
            const key = e.status as keyof typeof stats;
            if (key in stats && typeof stats[key] === 'number') {
                (stats as Record<string, number | string[]>)[key] = e._count.status;
            }
        });

        return NextResponse.json({
            prospectos,
            estatisticas: stats,
            paginacao: {
                total,
                limit: limit ? parseInt(limit) : 100,
                offset: offset ? parseInt(offset) : 0,
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
        const body = await request.json();

        // Verificar se CNPJ já existe
        const existente = await prisma.prospecto.findUnique({
            where: { cnpj: body.cnpj }
        });

        if (existente) {
            return NextResponse.json(
                { error: 'CNPJ já cadastrado', prospecto: existente },
                { status: 409 }
            );
        }

        const prospecto = await prisma.prospecto.create({
            data: body
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
