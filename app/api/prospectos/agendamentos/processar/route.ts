import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { enviarLeadsAoFunil } from '@/lib/prospectos/enviarAoFunil';

function getBrazilDateString(date: Date) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

function hasSchedulerSecret(request: NextRequest) {
    const secret = process.env.LEADS_SCHEDULER_SECRET;
    if (!secret) return false;

    const headerSecret = request.headers.get('x-scheduler-secret');
    if (headerSecret === secret) return true;

    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${secret}`;
}

function simplifyError(error: unknown) {
    if (error instanceof Error) {
        return error.message.slice(0, 500);
    }
    return 'Erro inesperado';
}

async function processar(request: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(request);
        const schedulerAuth = hasSchedulerSecret(request);

        if (!userId && !schedulerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const hoje = getBrazilDateString(new Date());

        const pendentes = await prisma.prospectoEnvioAgendado.findMany({
            where: {
                status: 'pendente',
                dataEnvio: { lte: hoje },
                ...(schedulerAuth ? {} : { userId }),
            },
            orderBy: [
                { dataEnvio: 'asc' },
                { createdAt: 'asc' },
            ],
            take: schedulerAuth ? 1000 : 200,
        });

        if (pendentes.length === 0) {
            return NextResponse.json({
                success: true,
                processados: 0,
                enviados: 0,
                erros: 0,
            });
        }

        let processados = 0;
        let enviados = 0;
        let erros = 0;

        for (const agendamento of pendentes) {
            const claimed = await prisma.prospectoEnvioAgendado.updateMany({
                where: {
                    id: agendamento.id,
                    status: 'pendente',
                },
                data: {
                    status: 'processando',
                },
            });

            if (claimed.count === 0) {
                continue;
            }

            try {
                const enviadosNoLote = await enviarLeadsAoFunil({
                    prisma,
                    userId: agendamento.userId,
                    filtro: { lote: agendamento.lote },
                    dataEnvio: new Date(),
                });

                await prisma.prospectoEnvioAgendado.update({
                    where: { id: agendamento.id },
                    data: {
                        status: 'processado',
                        enviados: enviadosNoLote,
                        executadoEm: new Date(),
                        erro: null,
                    },
                });

                processados += 1;
                enviados += enviadosNoLote;
            } catch (error) {
                erros += 1;
                await prisma.prospectoEnvioAgendado.update({
                    where: { id: agendamento.id },
                    data: {
                        status: 'erro',
                        erro: simplifyError(error),
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            processados,
            enviados,
            erros,
        });
    } catch (error) {
        console.error('Erro ao processar agendamentos:', error);
        return NextResponse.json(
            { error: 'Erro ao processar agendamentos' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return processar(request);
}

export async function GET(request: NextRequest) {
    return processar(request);
}
