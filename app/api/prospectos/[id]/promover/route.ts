/**
 * API para promover prospecto (converter em oportunidade de Negociação)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/prospectos/[id]/promover
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Buscar prospecto
        const prospecto = await prisma.prospecto.findFirst({
            where: { id, userId }
        });

        if (!prospecto) {
            return NextResponse.json(
                { error: 'Prospecto não encontrado' },
                { status: 404 }
            );
        }

        if (prospecto.status === 'convertido') {
            return NextResponse.json(
                { error: 'Prospecto já foi convertido' },
                { status: 409 }
            );
        }

        // 1. Garantir que existe Cliente
        let clienteId = prospecto.clienteId;

        if (!clienteId) {
            // Verificar por email ou CNPJ se já existe cliente
            const clienteExistente = await prisma.cliente.findFirst({
                where: {
                    userId,
                    OR: [
                        { email: prospecto.email || undefined },
                    ].filter(Boolean) as any
                }
            });

            if (clienteExistente) {
                clienteId = clienteExistente.id;
            } else {
                // Criar Cliente
                const novoCliente = await prisma.cliente.create({
                    data: {
                        userId,
                        nome: prospecto.nomeFantasia || prospecto.razaoSocial,
                        email: prospecto.email,
                        telefone: prospecto.telefone1,
                        empresa: prospecto.razaoSocial,
                        cidade: prospecto.municipio,
                        estado: prospecto.uf,
                        cep: prospecto.cep,
                        endereco: [
                            prospecto.logradouro,
                            prospecto.numero,
                            prospecto.bairro
                        ].filter(Boolean).join(', ')
                    }
                });
                clienteId = novoCliente.id;
            }
        }

        // 2. Garantir um Ambiente (Environment)
        let ambiente = await prisma.ambiente.findFirst({
            where: { userId }
        });

        if (!ambiente) {
            // Criar ambiente padrão se não existir
            ambiente = await prisma.ambiente.create({
                data: {
                    userId,
                    nome: 'Geral',
                    descricao: 'Ambiente padrão'
                }
            });
        }

        // Ler body se existir para status customizado (opcional)
        let targetStatus = 'proposta'; // Default now is Proposta
        try {
            const body = await request.json();
            if (body.status && ['proposta', 'negociacao', 'fechada'].includes(body.status)) {
                targetStatus = body.status;
            }
        } catch (e) {
            // Body might be empty
        }

        // 3. Criar Oportunidade
        const oportunidade = await prisma.oportunidade.create({
            data: {
                userId,
                clienteId: clienteId!,
                ambienteId: ambiente.id,
                titulo: `Oportunidade - ${prospecto.nomeFantasia || prospecto.razaoSocial}`,
                status: targetStatus,
                valor: 0,
                probabilidade: targetStatus === 'negociacao' ? 50 : 25
            }
        });

        // 4. Atualizar Prospecto para Convertido
        await prisma.prospecto.update({
            where: { id },
            data: {
                status: 'convertido',
                clienteId: clienteId
            }
        });

        return NextResponse.json({
            success: true,
            oportunidade,
            mensagem: 'Prospecto promovido para negociação!'
        });

    } catch (error) {
        console.error('Erro ao promover prospecto:', error);
        return NextResponse.json(
            { error: 'Erro ao promover prospecto' },
            { status: 500 }
        );
    }
}
