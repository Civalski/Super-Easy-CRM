import { Prisma, PrismaClient } from '@prisma/client';

export interface EnvioAoFunilFiltro {
    ids?: string[];
    lote?: string | null;
    todos?: boolean;
    novoStatus?: string;
}

export function normalizeLote(lote?: string | null): string | null | undefined {
    if (typeof lote === 'undefined') return undefined;
    if (lote === '' || lote === '(sem lote)') return null;
    return lote;
}

export function buildLeadsFriosWhere(userId: string, filtro: EnvioAoFunilFiltro): Prisma.ProspectoWhereInput {
    const loteNormalizado = normalizeLote(filtro.lote);
    const ids = Array.isArray(filtro.ids) ? filtro.ids.filter(Boolean) : [];

    const where: Prisma.ProspectoWhereInput = {
        userId,
        OR: [
            { status: 'lead_frio' },
            { status: 'novo', ultimoContato: null },
        ],
    };

    if (ids.length > 0) {
        return {
            userId,
            id: { in: ids },
            status: { in: ['lead_frio', 'novo'] },
        };
    }

    if (typeof loteNormalizado !== 'undefined') {
        where.lote = loteNormalizado;
        return where;
    }

    if (filtro.todos) {
        return where;
    }

    throw new Error('Especifique ids, lote ou todos=true');
}

export async function enviarLeadsAoFunil(params: {
    prisma: PrismaClient;
    userId: string;
    filtro: EnvioAoFunilFiltro;
    dataEnvio?: Date;
}) {
    const where = buildLeadsFriosWhere(params.userId, params.filtro);
    const dataEnvio = params.dataEnvio ?? new Date();

    const result = await params.prisma.prospecto.updateMany({
        where,
        data: {
            status: params.filtro.novoStatus ?? 'novo',
            ultimoContato: dataEnvio,
        },
    });

    return result.count;
}
