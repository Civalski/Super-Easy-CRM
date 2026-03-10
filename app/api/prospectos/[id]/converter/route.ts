export const dynamic = 'force-dynamic'

/**
 * API para converter prospecto em cliente
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/route-helpers';
import { logBusinessEvent } from '@/lib/observability/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/prospectos/[id]/converter - Converte prospecto em cliente
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
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
                { error: 'Prospecto já foi convertido', clienteId: prospecto.clienteId },
                { status: 409 }
            );
        }

        // Verificar se já existe cliente com este email (se tiver email)
        let emailParaUsar = prospecto.email;
        if (emailParaUsar) {
            const clienteExistente = await prisma.cliente.findFirst({
                where: { email: emailParaUsar, userId }
            });
            if (clienteExistente) {
                // Email já existe, usar null para evitar conflito
                emailParaUsar = null;
            }
        }

        // Criar cliente B2B a partir do prospecto (preserva todos os campos)
        const cliente = await prisma.cliente.create({
            data: {
                userId,
                nome: prospecto.nomeFantasia || prospecto.razaoSocial,
                email: emailParaUsar,
                telefone: prospecto.telefone1,
                empresa: prospecto.razaoSocial,
                documento: prospecto.cnpj,
                endereco: [
                    prospecto.tipoLogradouro,
                    prospecto.logradouro,
                    prospecto.numero,
                    prospecto.complemento
                ].filter(Boolean).join(' '),
                cidade: prospecto.municipio,
                estado: prospecto.uf,
                cep: prospecto.cep,
                // Campos B2B
                cnpj: prospecto.cnpj,
                matrizFilial: prospecto.matrizFilial,
                razaoSocial: prospecto.razaoSocial,
                nomeFantasia: prospecto.nomeFantasia,
                capitalSocial: prospecto.capitalSocial,
                porte: prospecto.porte,
                naturezaJuridica: prospecto.naturezaJuridica,
                situacaoCadastral: prospecto.situacaoCadastral,
                dataAbertura: prospecto.dataAbertura,
                tipoLogradouro: prospecto.tipoLogradouro,
                logradouro: prospecto.logradouro,
                numeroEndereco: prospecto.numero,
                complemento: prospecto.complemento,
                bairro: prospecto.bairro,
                telefone2: prospecto.telefone2,
                fax: prospecto.fax,
                cnaePrincipal: prospecto.cnaePrincipal,
                cnaePrincipalDesc: prospecto.cnaePrincipalDesc,
                cnaesSecundarios: prospecto.cnaesSecundarios,
            }
        });

        // Atualizar prospecto com status convertido e referência ao cliente
        await prisma.prospecto.updateMany({
            where: { id, userId },
            data: {
                status: 'convertido',
                clienteId: cliente.id
            }
        });

        logBusinessEvent({
            event: 'prospecto.convertido',
            userId,
            entity: 'prospecto',
            entityId: id,
            from: prospecto.status,
            to: 'convertido',
            metadata: {
                clienteId: cliente.id,
            },
        })

        return NextResponse.json({
            success: true,
            cliente,
            mensagem: 'Prospecto convertido em cliente com sucesso'
        });

    } catch (error) {
      console.error('Erro ao converter prospecto:', error);
      return NextResponse.json(
        { error: 'Erro ao converter prospecto' },
        { status: 500 }
      );
    }
  });
}
