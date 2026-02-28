import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function parseLimit(value: string | null, fallback = 20) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(50, Math.max(1, parsed))
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const codigo = searchParams.get('codigo')?.trim()
    const limit = parseLimit(searchParams.get('limit'))
    const ativo = searchParams.get('ativo')
    const ativoFilter = ativo === 'false' ? false : true

    const shouldLookupByCode = Boolean(codigo)
    const shouldFilterQuery = !shouldLookupByCode && Boolean(query && query.length >= 2)
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
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      take: shouldLookupByCode ? 1 : limit,
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
          produto.precoPadrao || 0
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
}
