import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { parseLimit } from '@/lib/validations/common'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const codigo = searchParams.get('codigo')?.trim()
    const limit = parseLimit(searchParams.get('limit'))
    const ativo = searchParams.get('ativo')
    const ativoFilter = ativo === 'false' ? false : true

    const shouldLookupByCode = Boolean(codigo)
    const shouldFilterQuery = !shouldLookupByCode && Boolean(query && query.length >= 2)
    const isRecentList = !shouldLookupByCode && !shouldFilterQuery
    const produtos = await prisma.produtoServico.findMany({
      where: {
        userId,
        ativo: ativoFilter,
        ...(shouldLookupByCode
          ? {
              codigo: { equals: codigo!, mode: 'insensitive' },
            }
          : shouldFilterQuery
            ? {
                OR: [
                  { nome: { contains: query!, mode: 'insensitive' } },
                  { codigo: { contains: query!, mode: 'insensitive' } },
                  { categoria: { contains: query!, mode: 'insensitive' } },
                  { marca: { contains: query!, mode: 'insensitive' } },
                ],
              }
            : {}),
      },
      orderBy: isRecentList ? [{ createdAt: 'desc' }] : [{ ativo: 'desc' }, { nome: 'asc' }],
      take: shouldLookupByCode ? 1 : isRecentList ? 3 : limit,
      select: {
        id: true,
        nome: true,
        codigo: true,
        tipo: true,
        unidade: true,
        precoPadrao: true,
      },
    })

    const options = produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      subtitulo: [
        produto.codigo || null,
        produto.tipo === 'servico' ? 'Servico' : 'Produto',
        produto.unidade || null,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          Number(produto.precoPadrao || 0)
        ),
      ]
        .filter(Boolean)
        .join(' | '),
      tipo: 'outro' as const,
      original: produto,
    }))

      return NextResponse.json(options)
    } catch (error) {
      console.error('Erro ao buscar produtos/servicos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar produtos/servicos' },
        { status: 500 }
      )
    }
  })
}
