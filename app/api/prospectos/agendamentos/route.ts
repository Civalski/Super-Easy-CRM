import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { normalizeLote } from '@/lib/prospectos/enviarAoFunil';

export const dynamic = 'force-dynamic'

type AgendamentoInput = {
    lote?: string | null;
    dataEnvio?: string;
};

function getBrazilDateString(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function isValidDateString(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseStatusFilter(value: string | null) {
    if (value === 'historico') return ['processado', 'cancelado'];
    if (value === 'todos') return undefined;
    return ['pendente', 'processando', 'erro'];
}

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
        const statusFilter = parseStatusFilter(status);

        const agendamentos = await prisma.prospectoEnvioAgendado.findMany({
            where: {
                userId,
                ...(statusFilter ? { status: { in: statusFilter } } : {}),
            },
            orderBy: [
                { dataEnvio: 'asc' },
                { createdAt: 'asc' },
            ],
            take: Number.isFinite(limit) && limit > 0 ? limit : 100,
        });

        return NextResponse.json({ agendamentos });
    } catch (error) {
        console.error('Erro ao listar agendamentos:', error);
        return NextResponse.json(
            { error: 'Erro ao listar agendamentos' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const itens = Array.isArray(body?.itens) ? (body.itens as AgendamentoInput[]) : [];

        if (itens.length === 0) {
            return NextResponse.json(
                { error: 'Envie ao menos um lote para agendar' },
                { status: 400 }
            );
        }

        const hoje = getBrazilDateString(new Date());
        const normalizados = itens.map((item) => {
            const dataEnvio = (item.dataEnvio ?? '').trim();
            const lote = normalizeLote(item.lote);
            return { lote, dataEnvio };
        });

        for (const item of normalizados) {
            if (!isValidDateString(item.dataEnvio)) {
                return NextResponse.json(
                    { error: `Data invalida no formato YYYY-MM-DD: ${item.dataEnvio}` },
                    { status: 400 }
                );
            }

            if (item.dataEnvio < hoje) {
                return NextResponse.json(
                    { error: `Nao e permitido agendar no passado: ${item.dataEnvio}` },
                    { status: 400 }
                );
            }
        }

        const seen = new Set<string>();
        for (const item of normalizados) {
            const key = `${item.lote ?? '__sem_lote__'}|${item.dataEnvio}`;
            if (seen.has(key)) {
                return NextResponse.json(
                    { error: `Lote duplicado na mesma data: ${item.lote ?? '(sem lote)'} - ${item.dataEnvio}` },
                    { status: 400 }
                );
            }
            seen.add(key);
        }

        const lotesUnicos = Array.from(new Set(normalizados.map((item) => item.lote ?? '__sem_lote__')));
        const conflitos = await prisma.prospectoEnvioAgendado.findMany({
            where: {
                userId,
                status: { in: ['pendente', 'processando'] },
                OR: lotesUnicos.map((lote) => (lote === '__sem_lote__' ? { lote: null } : { lote })),
            },
            select: { lote: true, dataEnvio: true },
        });

        if (conflitos.length > 0) {
            const lista = conflitos
                .map((item) => `${item.lote ?? '(sem lote)'} (${item.dataEnvio})`)
                .join(', ');
            return NextResponse.json(
                { error: `Ja existe agendamento ativo para: ${lista}` },
                { status: 409 }
            );
        }

        const created = await prisma.$transaction(
            normalizados.map((item) =>
                prisma.prospectoEnvioAgendado.create({
                    data: {
                        userId,
                        lote: item.lote,
                        dataEnvio: item.dataEnvio,
                        status: 'pendente',
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            total: created.length,
            agendamentos: created,
        });
    } catch (error) {
        console.error('Erro ao criar agendamentos:', error);
        return NextResponse.json(
            { error: 'Erro ao criar agendamentos' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Informe o id do agendamento para cancelar' },
                { status: 400 }
            );
        }

        const agendamento = await prisma.prospectoEnvioAgendado.findFirst({
            where: { id, userId },
        });

        if (!agendamento) {
            return NextResponse.json(
                { error: 'Agendamento nao encontrado' },
                { status: 404 }
            );
        }

        if (agendamento.status === 'processado') {
            return NextResponse.json(
                { error: 'Agendamento ja foi processado e nao pode ser cancelado' },
                { status: 409 }
            );
        }

        if (agendamento.status === 'cancelado') {
            return NextResponse.json({ success: true, cancelado: true });
        }

        await prisma.prospectoEnvioAgendado.update({
            where: { id: agendamento.id },
            data: { status: 'cancelado' },
        });

        return NextResponse.json({ success: true, cancelado: true });
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        return NextResponse.json(
            { error: 'Erro ao cancelar agendamento' },
            { status: 500 }
        );
    }
}
