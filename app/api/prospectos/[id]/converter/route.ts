/**
 * API para converter prospecto em cliente
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/prospectos/[id]/converter - Converte prospecto em cliente
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Buscar prospecto
        const prospecto = await prisma.prospecto.findUnique({
            where: { id }
        });

        if (!prospecto) {
            return NextResponse.json(
                { error: 'Prospecto não encontrado' },
                { status: 404 }
            );
        }

        if (prospecto.status === 'convertido') {
            return NextResponse.json(
                { error: 'Prospecto já foi convertido', clienteId: prospecto.clienteId },
                { status: 409 }
            );
        }

        // Verificar se já existe cliente com este email (se tiver email)
        let emailParaUsar = prospecto.email;
        if (emailParaUsar) {
            const clienteExistente = await prisma.cliente.findUnique({
                where: { email: emailParaUsar }
            });
            if (clienteExistente) {
                // Email já existe, usar null para evitar conflito
                emailParaUsar = null;
            }
        }

        // Criar cliente a partir do prospecto
        const cliente = await prisma.cliente.create({
            data: {
                nome: prospecto.nomeFantasia || prospecto.razaoSocial,
                email: emailParaUsar,
                telefone: prospecto.telefone1,
                empresa: prospecto.razaoSocial,
                endereco: [
                    prospecto.tipoLogradouro,
                    prospecto.logradouro,
                    prospecto.numero,
                    prospecto.complemento
                ].filter(Boolean).join(' '),
                cidade: prospecto.municipio,
                estado: prospecto.uf,
                cep: prospecto.cep,
            }
        });

        // Atualizar prospecto com status convertido e referência ao cliente
        await prisma.prospecto.update({
            where: { id },
            data: {
                status: 'convertido',
                clienteId: cliente.id
            }
        });

        return NextResponse.json({
            success: true,
            cliente,
            mensagem: 'Prospecto convertido em cliente com sucesso'
        });

    } catch (error) {
        console.error('Erro ao converter prospecto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return NextResponse.json(
            { error: 'Erro ao converter prospecto', detalhes: errorMessage },
            { status: 500 }
        );
    }
}
