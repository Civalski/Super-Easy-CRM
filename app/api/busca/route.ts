import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const clientes = await prisma.cliente.findMany({
      where: {
        userId,
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { empresa: { contains: query, mode: 'insensitive' } },
          { telefone: { contains: query } },
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

    const oportunidades = await prisma.oportunidade.findMany({
      where: {
        userId,
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { descricao: { contains: query, mode: 'insensitive' } },
          { cliente: { nome: { contains: query, mode: 'insensitive' } } },
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

    const parsedNumero = Number(query)
    const numeroFiltro = Number.isInteger(parsedNumero) ? parsedNumero : null

    const pedidos = await prisma.pedido.findMany({
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

    return NextResponse.json({
      clientes,
      oportunidades,
      pedidos,
    })
  } catch (error) {
    console.error('Erro ao buscar:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar' },
      { status: 500 }
    )
  }
}
