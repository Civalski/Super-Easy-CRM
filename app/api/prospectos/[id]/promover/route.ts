import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { logBusinessEvent } from '@/lib/observability/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => null)
    const requestedStatus =
      typeof body?.status === 'string' ? body.status.trim().toLowerCase() : null

    // Promocao de prospecto nao pode fechar venda diretamente.
    if (requestedStatus && requestedStatus !== 'orcamento') {
      return NextResponse.json(
        { error: 'Prospecto so pode ser promovido para orçamento' },
        { status: 400 }
      )
    }

      const result = await prisma.$transaction(async (tx) => {
      const prospecto = await tx.prospecto.findFirst({
        where: { id, userId },
      })

      if (!prospecto) {
        return { type: 'not_found' as const }
      }

      if (prospecto.status === 'convertido') {
        return { type: 'already_converted' as const }
      }

      let clienteId = prospecto.clienteId

      if (!clienteId) {
        const existingCliente = prospecto.email
          ? await tx.cliente.findFirst({
              where: {
                userId,
                email: prospecto.email,
              },
            })
          : null

        if (existingCliente) {
          clienteId = existingCliente.id
        } else {
          const createdCliente = await tx.cliente.create({
            data: {
              userId,
              nome: prospecto.nomeFantasia || prospecto.razaoSocial,
              email: prospecto.email,
              telefone: prospecto.telefone1,
              empresa: prospecto.razaoSocial,
              cidade: prospecto.municipio,
              estado: prospecto.uf,
              cep: prospecto.cep,
              endereco: [prospecto.logradouro, prospecto.numero, prospecto.bairro]
                .filter(Boolean)
                .join(', '),
            },
          })
          clienteId = createdCliente.id
        }
      }

      const oportunidade = await tx.oportunidade.create({
        data: {
          userId,
          clienteId,
          titulo: `Oportunidade - ${prospecto.nomeFantasia || prospecto.razaoSocial}`,
          status: 'orcamento',
          valor: 0,
          probabilidade: 25,
        },
      })

      const updated = await tx.prospecto.updateMany({
        where: { id, userId },
        data: {
          status: 'convertido',
          clienteId,
        },
      })

      if (updated.count === 0) {
        return { type: 'not_found' as const }
      }

      return {
        type: 'success' as const,
        oportunidade,
      }
    })

    if (result.type === 'not_found') {
      return NextResponse.json({ error: 'Prospecto nao encontrado' }, { status: 404 })
    }

    if (result.type === 'already_converted') {
      return NextResponse.json(
        { error: 'Prospecto ja foi convertido' },
        { status: 409 }
      )
    }

    logBusinessEvent({
      event: 'prospecto.promovido',
      userId,
      entity: 'prospecto',
      entityId: id,
      from: 'qualificado',
      to: 'convertido',
      metadata: {
        oportunidadeId: result.oportunidade.id,
      },
    })

    return NextResponse.json({
      success: true,
      oportunidade: result.oportunidade,
      mensagem: 'Prospecto promovido para orçamento',
    })

    } catch (error) {
      console.error('Erro ao promover prospecto:', error)
      return NextResponse.json(
        { error: 'Erro ao promover prospecto' },
        { status: 500 }
      )
    }
  })
}
