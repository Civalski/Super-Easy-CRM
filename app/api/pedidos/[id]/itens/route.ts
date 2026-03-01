import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { calculateItemSubtotal, recalculatePedidoTotals } from '@/lib/pedidos/totals'
import { roundMoney } from '@/lib/money'

export const dynamic = 'force-dynamic'

function parsePositive(value: unknown, fallback = 0) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? roundMoney(parsed) : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pedido = await prisma.pedido.findFirst({
      where: { id: (await params).id, userId },
      select: { id: true, totalBruto: true, totalDesconto: true, totalLiquido: true },
    })

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    const itens = await prisma.pedidoItem.findMany({
      where: { pedidoId: (await params).id, userId },
      include: {
        produtoServico: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      pedido,
      itens,
    })
  } catch (error) {
    console.error('Erro ao listar itens do pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao listar itens do pedido' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : ''
    const quantidade = parsePositive(payload.quantidade, 1)
    const precoUnitario = parsePositive(payload.precoUnitario)
    const desconto = parsePositive(payload.desconto)
    const produtoServicoId =
      typeof payload.produtoServicoId === 'string' ? payload.produtoServicoId.trim() : null

    if (!descricao) {
      return NextResponse.json({ error: 'Descricao e obrigatoria' }, { status: 400 })
    }
    if (quantidade === null || quantidade <= 0) {
      return NextResponse.json({ error: 'Quantidade invalida' }, { status: 400 })
    }
    if (precoUnitario === null || desconto === null) {
      return NextResponse.json({ error: 'Valores invalidos' }, { status: 400 })
    }

    const pedido = await prisma.pedido.findFirst({
      where: { id: (await params).id, userId },
      select: { id: true },
    })
    if (!pedido) {
      return NextResponse.json({ error: 'Pedido nao encontrado' }, { status: 404 })
    }

    if (produtoServicoId) {
      const produto = await prisma.produtoServico.findFirst({
        where: { id: produtoServicoId, userId },
        select: { id: true },
      })
      if (!produto) {
        return NextResponse.json({ error: 'Produto/servico nao encontrado' }, { status: 404 })
      }
    }

    const subtotalData = calculateItemSubtotal({
      quantidade,
      precoUnitario,
      desconto,
    })

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.pedidoItem.create({
        data: {
          userId,
          pedidoId: (await params).id,
          produtoServicoId: produtoServicoId || null,
          descricao,
          quantidade,
          precoUnitario,
          desconto,
          subtotal: subtotalData.subtotal,
        },
      })

      const totals = await recalculatePedidoTotals(tx, userId, (await params).id)
      return { item, totals }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar item' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const itemId = typeof payload.itemId === 'string' ? payload.itemId.trim() : ''
    if (!itemId) {
      return NextResponse.json({ error: 'itemId e obrigatorio' }, { status: 400 })
    }

    const existing = await prisma.pedidoItem.findFirst({
      where: { id: itemId, pedidoId: (await params).id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 })
    }

    const quantidade = parsePositive(payload.quantidade, existing.quantidade)
    const precoUnitario = parsePositive(payload.precoUnitario, existing.precoUnitario)
    const desconto = parsePositive(payload.desconto, existing.desconto)
    const descricao =
      typeof payload.descricao === 'string' ? payload.descricao.trim() : existing.descricao

    if (quantidade === null || quantidade <= 0 || precoUnitario === null || desconto === null) {
      return NextResponse.json({ error: 'Valores invalidos' }, { status: 400 })
    }

    const subtotalData = calculateItemSubtotal({
      quantidade,
      precoUnitario,
      desconto,
    })

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.pedidoItem.update({
        where: { id: itemId },
        data: {
          descricao,
          quantidade,
          precoUnitario,
          desconto,
          subtotal: subtotalData.subtotal,
        },
      })

      const totals = await recalculatePedidoTotals(tx, userId, (await params).id)
      return { item, totals }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')?.trim()
    if (!itemId) {
      return NextResponse.json({ error: 'itemId e obrigatorio' }, { status: 400 })
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const result = await tx.pedidoItem.deleteMany({
        where: { id: itemId, userId, pedidoId: (await params).id },
      })

      if (result.count === 0) return null

      const totals = await recalculatePedidoTotals(tx, userId, (await params).id)
      return { deleted: result.count, totals }
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ...deleted })
  } catch (error) {
    console.error('Erro ao excluir item:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir item' },
      { status: 500 }
    )
  }
}

