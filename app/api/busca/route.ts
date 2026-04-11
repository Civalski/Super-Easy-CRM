import { NextRequest, NextResponse } from 'next/server'
import { isOssEdition } from '@/lib/crmEdition'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { enforceApiRateLimit } from '@/lib/security/api-rate-limit'

export const dynamic = 'force-dynamic'

const buscaRateLimitConfig = {
  windowMs: 60 * 1000,
  maxAttempts: 30,
  blockDurationMs: 60 * 1000,
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const rateLimitResponse = enforceApiRateLimit({
      key: `api:busca:user:${userId}`,
      config: buscaRateLimitConfig,
      error: 'Muitas buscas em pouco tempo. Tente novamente em alguns segundos.',
    })
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    if (!query || query.length < 2) {
      return NextResponse.json({
        clientes: [],
        oportunidades: [],
        pedidos: [],
      })
    }

    const maxResultsPerType = 5
    const parsedClienteNumero = Number(query)
    const clienteNumeroFiltro = Number.isInteger(parsedClienteNumero) ? parsedClienteNumero : null

    const clientes = await prisma.cliente.findMany({
      where: {
        userId,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { empresa: { contains: query, mode: 'insensitive' } },
          { telefone: { contains: query } },
          ...(clienteNumeroFiltro !== null ? [{ numero: clienteNumeroFiltro }] : []),
        ],
      },
      include: {
        _count: {
          select: {
            oportunidades: true,
            contatos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: maxResultsPerType,
    })

    const parsedOrcNumero = Number(query)
    const orcNumeroFiltro = Number.isInteger(parsedOrcNumero) ? parsedOrcNumero : null

    const oportunidades = await prisma.oportunidade.findMany({
      where: {
        userId,
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { descricao: { contains: query, mode: 'insensitive' } },
          { cliente: { nome: { contains: query, mode: 'insensitive' } } },
          ...(orcNumeroFiltro !== null ? [{ numero: orcNumeroFiltro }] : []),
        ],
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },

      },
      orderBy: { createdAt: 'desc' },
      take: maxResultsPerType,
    })

    let pedidos: Awaited<ReturnType<typeof prisma.pedido.findMany>> = []

    if (!isOssEdition()) {
      const parsedNumero = Number(query)
      const numeroFiltro = Number.isInteger(parsedNumero) ? parsedNumero : null

      pedidos = await prisma.pedido.findMany({
        where: {
          userId,
          OR: [
            { oportunidade: { titulo: { contains: query, mode: 'insensitive' } } },
            { oportunidade: { cliente: { nome: { contains: query, mode: 'insensitive' } } } },
            ...(numeroFiltro !== null ? [{ numero: numeroFiltro }] : []),
          ],
        },
        include: {
          oportunidade: {
            select: {
              titulo: true,
              cliente: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: maxResultsPerType,
      })
    }

    return NextResponse.json(
      {
        clientes,
        oportunidades,
        pedidos,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    )
    } catch (error) {
      console.error('Erro ao buscar:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar' },
        { status: 500 }
      )
    }
  })
}
