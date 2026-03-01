import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { roundMoney, sumMoney } from '@/lib/money'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS_ENTREGA = new Set([
  'pendente',
  'em_preparacao',
  'enviado',
  'entregue',
])

type NormalizedPedidoItemInput = {
  produtoServicoId: string | null
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  subtotal: number
}

function normalizeStatusEntrega(status?: string | null) {
  if (!status) return undefined
  const normalizedInput = status.trim().toLowerCase()
  const normalizedStatus =
    normalizedInput === 'em preparacao'
      ? 'em_preparacao'
      : normalizedInput

  return ALLOWED_STATUS_ENTREGA.has(normalizedStatus) ? normalizedStatus : undefined
}

function parseOptionalString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseOptionalMoney(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return null
  return roundMoney(numeric)
}

function parsePedidoItemsInput(value: unknown): {
  items: NormalizedPedidoItemInput[]
  error?: string
} {
  if (value === undefined || value === null) {
    return { items: [] }
  }

  if (!Array.isArray(value)) {
    return { items: [], error: 'Itens invalidos' }
  }

  const items: NormalizedPedidoItemInput[] = []
  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      return { items: [], error: 'Itens invalidos' }
    }

    const item = rawItem as Record<string, unknown>
    const descricao = typeof item.descricao === 'string' ? item.descricao.trim() : ''
    const quantidade = Number(item.quantidade)
    const precoUnitarioRaw = Number(item.precoUnitario)
    const descontoRaw = Number(item.desconto ?? 0)
    const produtoServicoId =
      typeof item.produtoServicoId === 'string' && item.produtoServicoId.trim() !== ''
        ? item.produtoServicoId.trim()
        : null

    if (!descricao) {
      return { items: [], error: 'Descricao do item e obrigatoria' }
    }

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0 ||
      !Number.isFinite(precoUnitarioRaw) ||
      precoUnitarioRaw < 0 ||
      !Number.isFinite(descontoRaw) ||
      descontoRaw < 0
    ) {
      return { items: [], error: 'Valores dos itens invalidos' }
    }

    const precoUnitario = roundMoney(precoUnitarioRaw)
    const desconto = roundMoney(descontoRaw)
    const subtotal = roundMoney(Math.max(0, quantidade * precoUnitario - desconto))
    items.push({
      produtoServicoId,
      descricao,
      quantidade,
      precoUnitario,
      desconto,
      subtotal,
    })
  }

  return { items }
}

function parseLimit(value: string | null, fallback = 20, max = 50) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(1, parsed))
}

function parsePage(value: string | null, fallback = 1) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return Math.max(1, parsed)
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('statusEntrega')
    const clienteIdFilter = searchParams.get('clienteId')?.trim()
    const paginated = searchParams.get('paginated') === 'true'

    const where: Prisma.PedidoWhereInput = { userId }

    if (clienteIdFilter) {
      where.oportunidade = {
        is: {
          userId,
          clienteId: clienteIdFilter,
        },
      }
    }

    if (statusFilter) {
      const statuses = Array.from(
        new Set(
          statusFilter
            .split(',')
            .map((status) => normalizeStatusEntrega(status))
            .filter((status): status is string => Boolean(status))
        )
      )

      if (statuses.length > 0) {
        where.statusEntrega = { in: statuses }
      }
    }

    const baseQuery = {
      where,
      orderBy: [
        { createdAt: 'desc' as const },
      ],
      include: {
        oportunidade: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            valor: true,
            status: true,
            probabilidade: true,
            dataFechamento: true,
            createdAt: true,
            cliente: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'))
      const skip = (page - 1) * limit

      const [pedidos, total] = await Promise.all([
        prisma.pedido.findMany({
          ...baseQuery,
          skip,
          take: limit,
        }),
        prisma.pedido.count({ where }),
      ])

      return NextResponse.json({
        data: pedidos,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      })
    }

    const limit = parseLimit(searchParams.get('limit'))
    const pedidos = await prisma.pedido.findMany({
      ...baseQuery,
      take: limit,
    })

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const oportunidadeId =
      typeof body.oportunidadeId === 'string' ? body.oportunidadeId.trim() : ''

    const normalizedStatusEntrega = normalizeStatusEntrega(
      typeof body.statusEntrega === 'string' ? body.statusEntrega : undefined
    )
    if (body.statusEntrega !== undefined && !normalizedStatusEntrega) {
      return NextResponse.json(
        { error: 'Status de entrega invalido' },
        { status: 400 }
      )
    }

    const formaPagamento = parseOptionalString(body.formaPagamento)
    const observacoes = parseOptionalString(body.observacoes)
    const dataEntrega = parseOptionalDate(body.dataEntrega)
    const valor = parseOptionalMoney(body.valor)
    const parsedItems = parsePedidoItemsInput(body.itens)

    if (parsedItems.error) {
      return NextResponse.json(
        { error: parsedItems.error },
        { status: 400 }
      )
    }

    const itens = parsedItems.items

    if (body.dataEntrega !== undefined && body.dataEntrega && !dataEntrega) {
      return NextResponse.json(
        { error: 'Data de entrega invalida' },
        { status: 400 }
      )
    }

    const pagamentoConfirmado = body.pagamentoConfirmado === true
    const vendaConfirmada = pagamentoConfirmado && (normalizedStatusEntrega || 'pendente') === 'entregue'

    let oportunidadeFinalId = oportunidadeId
    let valorBasePedido = 0
    let pedidoDiretoCriado = false
    let pedidoDiretoData: {
      titulo: string
      descricao: string | null
      valor: number | null
      clienteId: string
    } | null = null

    if (oportunidadeFinalId) {
      const oportunidade = await prisma.oportunidade.findFirst({
        where: { id: oportunidadeFinalId, userId },
        select: {
          id: true,
          status: true,
          valor: true,
        },
      })

      if (!oportunidade) {
        return NextResponse.json(
          { error: 'Orçamento não encontrado' },
          { status: 404 }
        )
      }

      if (oportunidade.status !== 'orcamento') {
        return NextResponse.json(
          { error: 'Apenas orçamentos aprovados podem ser transformados em pedido' },
          { status: 400 }
        )
      }

      const pedidoExistente = await prisma.pedido.findUnique({
        where: { oportunidadeId: oportunidade.id },
        select: { id: true },
      })

      if (pedidoExistente) {
        return NextResponse.json(
          { error: 'Este orçamento já foi transformado em pedido', pedidoId: pedidoExistente.id },
          { status: 409 }
        )
      }

      valorBasePedido = roundMoney(oportunidade.valor ?? 0)
    } else {
      const titulo = parseOptionalString(body.titulo)
      const descricao = parseOptionalString(body.descricao)
      const clienteId = typeof body.clienteId === 'string' ? body.clienteId.trim() : ''

      if (!titulo) {
        return NextResponse.json(
          { error: 'Titulo e obrigatorio para criar pedido direto' },
          { status: 400 }
        )
      }

      if (!clienteId) {
        return NextResponse.json(
          { error: 'Cliente e obrigatorio para criar pedido direto' },
          { status: 400 }
        )
      }

      if (body.valor !== undefined && body.valor !== null && valor === null) {
        return NextResponse.json(
          { error: 'Valor invalido' },
          { status: 400 }
        )
      }

      const cliente = await prisma.cliente.findFirst({
        where: { id: clienteId, userId },
        select: { id: true },
      })

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente nao encontrado' },
          { status: 404 }
        )
      }

      pedidoDiretoData = {
        titulo,
        descricao: descricao ?? null,
        valor: valor === undefined ? null : valor,
        clienteId: cliente.id,
      }
      valorBasePedido = roundMoney(pedidoDiretoData.valor ?? 0)
    }

    const produtoIds = Array.from(
      new Set(
        itens
          .map((item) => item.produtoServicoId)
          .filter((id): id is string => Boolean(id))
      )
    )
    if (produtoIds.length > 0) {
      const produtos = await prisma.produtoServico.findMany({
        where: { userId, id: { in: produtoIds } },
        select: { id: true },
      })

      if (produtos.length !== produtoIds.length) {
        return NextResponse.json(
          { error: 'Produto/servico nao encontrado para um dos itens' },
          { status: 404 }
        )
      }
    }

    const pedidoCriado = await prisma.$transaction(async (tx) => {
      if (pedidoDiretoData) {
        const oportunidadeDireta = await tx.oportunidade.create({
          data: {
            userId,
            titulo: pedidoDiretoData.titulo,
            descricao: pedidoDiretoData.descricao,
            valor: pedidoDiretoData.valor,
            status: vendaConfirmada ? 'fechada' : 'orcamento',
            probabilidade: 0,
            dataFechamento: vendaConfirmada ? new Date() : null,
            clienteId: pedidoDiretoData.clienteId,
          },
          select: { id: true },
        })

        oportunidadeFinalId = oportunidadeDireta.id
        pedidoDiretoCriado = true
      }

      const temItens = itens.length > 0
      const totalBrutoItens = sumMoney(
        itens.map((item) => roundMoney(item.quantidade * item.precoUnitario))
      )
      const totalDescontoItens = sumMoney(itens.map((item) => roundMoney(item.desconto)))
      const totalLiquidoItens = sumMoney(itens.map((item) => roundMoney(item.subtotal)))

      const totalBruto = temItens ? totalBrutoItens : roundMoney(valorBasePedido)
      const totalDesconto = temItens ? totalDescontoItens : 0
      const totalLiquido = temItens ? totalLiquidoItens : roundMoney(valorBasePedido)

      const pedido = await tx.pedido.create({
        data: {
          userId,
          oportunidadeId: oportunidadeFinalId,
          statusEntrega: normalizedStatusEntrega || 'pendente',
          pagamentoConfirmado,
          formaPagamento: formaPagamento === undefined ? null : formaPagamento,
          dataEntrega: dataEntrega === undefined ? null : dataEntrega,
          observacoes: observacoes === undefined ? null : observacoes,
          totalBruto,
          totalDesconto,
          totalLiquido,
        },
      })

      if (temItens) {
        await tx.pedidoItem.createMany({
          data: itens.map((item) => ({
            userId,
            pedidoId: pedido.id,
            produtoServicoId: item.produtoServicoId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            desconto: item.desconto,
            subtotal: item.subtotal,
          })),
        })

        await tx.oportunidade.updateMany({
          where: { id: oportunidadeFinalId, userId },
          data: {
            valor: roundMoney(totalLiquido),
          },
        })
      }

      if (vendaConfirmada && !pedidoDiretoCriado) {
        await tx.oportunidade.updateMany({
          where: { id: oportunidadeFinalId, userId },
          data: {
            statusAnterior: 'orcamento',
            status: 'fechada',
            dataFechamento: new Date(),
          },
        })
      }

      return pedido
    })

    const pedidoCompleto = await prisma.pedido.findFirst({
      where: { id: pedidoCriado.id, userId },
      include: {
        oportunidade: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            valor: true,
            status: true,
            probabilidade: true,
            dataFechamento: true,
            createdAt: true,
            cliente: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...pedidoCompleto,
        pedidoDiretoCriado,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao criar pedido:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este orçamento já foi transformado em pedido' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}
