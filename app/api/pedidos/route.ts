import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { listPedidos, normalizeStatusEntrega } from '@/lib/services/pedidos'
import { roundMoney, sumMoney } from '@/lib/money'
import { parseLimit, parsePage } from '@/lib/validations/common'

export const dynamic = 'force-dynamic'

const ALLOWED_PAYMENT_METHODS = new Set([
  'pix',
  'dinheiro',
  'cartao',
  'parcelado',
])

const ALLOWED_NEXT_ACTION_CHANNELS = new Set([
  'whatsapp',
  'email',
  'ligacao',
  'reuniao',
  'outro',
])

type NormalizedPedidoItemInput = {
  produtoServicoId: string | null
  descricao: string
  quantidade: number
  precoUnitario: number
  desconto: number
  subtotal: number
}

function parseOptionalString(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function normalizeFormaPagamento(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const normalizedInput = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalizedInput === '') return null
  if (normalizedInput === 'parcelamento') return 'parcelado'

  return ALLOWED_PAYMENT_METHODS.has(normalizedInput)
    ? normalizedInput
    : undefined
}

function parseOptionalParcelas(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 24) return undefined
  return parsed
}

function parseOptionalNonNegativeNumber(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return roundMoney(parsed)
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

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const result = await listPedidos(userId, {
        filters: {
          statusEntrega: searchParams.get('statusEntrega') ?? undefined,
          clienteId: searchParams.get('clienteId') ?? undefined,
          search: searchParams.get('search')?.trim() || undefined,
        },
        paginated: searchParams.get('paginated') === 'true',
        limit: parseLimit(searchParams.get('limit')),
        page: parsePage(searchParams.get('page')),
      })
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

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

    const normalizedFormaPagamento = normalizeFormaPagamento(body.formaPagamento)
    if (body.formaPagamento !== undefined && normalizedFormaPagamento === undefined) {
      return NextResponse.json(
        { error: 'Forma de pagamento invalida' },
        { status: 400 }
      )
    }

    const normalizedParcelas = parseOptionalParcelas(body.parcelas)
    if (body.parcelas !== undefined && normalizedParcelas === undefined) {
      return NextResponse.json(
        { error: 'Parcelas invalidas (use um numero inteiro entre 1 e 24)' },
        { status: 400 }
      )
    }

    const normalizedDesconto = parseOptionalNonNegativeNumber(body.desconto)
    if (body.desconto !== undefined && normalizedDesconto === undefined) {
      return NextResponse.json(
        { error: 'Desconto invalido' },
        { status: 400 }
      )
    }

    const probabilidadeRaw = body.probabilidade
    let normalizedProbabilidade: number | undefined
    if (probabilidadeRaw !== undefined) {
      const parsedProbability = Number(probabilidadeRaw)
      if (
        !Number.isInteger(parsedProbability) ||
        parsedProbability < 0 ||
        parsedProbability > 100
      ) {
        return NextResponse.json(
          { error: 'Probabilidade invalida' },
          { status: 400 }
        )
      }
      normalizedProbabilidade = parsedProbability
    }

    const dataFechamento = parseOptionalDate(body.dataFechamento)
    if (body.dataFechamento !== undefined && body.dataFechamento && !dataFechamento) {
      return NextResponse.json(
        { error: 'Data prevista invalida' },
        { status: 400 }
      )
    }

    const proximaAcaoEm = parseOptionalDate(body.proximaAcaoEm)
    if (body.proximaAcaoEm !== undefined && body.proximaAcaoEm && !proximaAcaoEm) {
      return NextResponse.json(
        { error: 'Data da proxima acao invalida' },
        { status: 400 }
      )
    }

    const normalizedCanalProximaAcao = parseOptionalString(body.canalProximaAcao)
    if (
      normalizedCanalProximaAcao &&
      !ALLOWED_NEXT_ACTION_CHANNELS.has(normalizedCanalProximaAcao.toLowerCase())
    ) {
      return NextResponse.json(
        { error: 'Canal da proxima acao invalido' },
        { status: 400 }
      )
    }

    const normalizedResponsavelProximaAcao = parseOptionalString(body.responsavelProximaAcao)
    const lembreteProximaAcao = body.lembreteProximaAcao === true
    if (body.lembreteProximaAcao !== undefined && typeof body.lembreteProximaAcao !== 'boolean') {
      return NextResponse.json(
        { error: 'Lembrete da proxima acao invalido' },
        { status: 400 }
      )
    }

    if (normalizedFormaPagamento === 'parcelado' && (!normalizedParcelas || normalizedParcelas < 2)) {
      return NextResponse.json(
        { error: 'Para pagamento parcelado, informe ao menos 2 parcelas' },
        { status: 400 }
      )
    }

    const parcelasFinais =
      normalizedFormaPagamento === 'parcelado' ? normalizedParcelas ?? null : null

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
    let formaPagamentoBasePedido: string | null = null
    let numeroPreferencial: number | null = null
    let pedidoDiretoData: {
      titulo: string
      descricao: string | null
      valor: number | null
      clienteId: string
      formaPagamento: string | null
      parcelas: number | null
      desconto: number | null
      probabilidade: number
      dataFechamento: Date | null
      proximaAcaoEm: Date | null
      canalProximaAcao: string | null
      responsavelProximaAcao: string | null
      lembreteProximaAcao: boolean
    } | null = null

    if (oportunidadeFinalId) {
      const oportunidade = await prisma.oportunidade.findFirst({
        where: { id: oportunidadeFinalId, userId },
        select: {
          id: true,
          numero: true,
          titulo: true,
          status: true,
          valor: true,
          formaPagamento: true,
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
      formaPagamentoBasePedido = normalizeFormaPagamento(oportunidade.formaPagamento) ?? null
      numeroPreferencial = oportunidade.numero
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
        formaPagamento: normalizedFormaPagamento ?? null,
        parcelas: parcelasFinais,
        desconto: normalizedDesconto ?? null,
        probabilidade: normalizedProbabilidade ?? 0,
        dataFechamento: dataFechamento ?? null,
        proximaAcaoEm: proximaAcaoEm ?? null,
        canalProximaAcao: normalizedCanalProximaAcao ? normalizedCanalProximaAcao.toLowerCase() : null,
        responsavelProximaAcao: normalizedResponsavelProximaAcao ?? null,
        lembreteProximaAcao,
      }
      valorBasePedido = roundMoney(pedidoDiretoData.valor ?? 0)
      formaPagamentoBasePedido = pedidoDiretoData.formaPagamento
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
            formaPagamento: pedidoDiretoData.formaPagamento,
            parcelas: pedidoDiretoData.parcelas,
            desconto: pedidoDiretoData.desconto,
            status: vendaConfirmada ? 'fechada' : 'pedido',
            statusAnterior: vendaConfirmada ? 'pedido' : null,
            probabilidade: pedidoDiretoData.probabilidade,
            dataFechamento: vendaConfirmada ? new Date() : pedidoDiretoData.dataFechamento,
            proximaAcaoEm: pedidoDiretoData.proximaAcaoEm,
            canalProximaAcao: pedidoDiretoData.canalProximaAcao,
            responsavelProximaAcao: pedidoDiretoData.responsavelProximaAcao,
            lembreteProximaAcao: pedidoDiretoData.lembreteProximaAcao,
            clienteId: pedidoDiretoData.clienteId,
          },
          select: { id: true, titulo: true, numero: true },
        })

        if (pedidoDiretoData.lembreteProximaAcao && pedidoDiretoData.proximaAcaoEm) {
          const canalLabel = pedidoDiretoData.canalProximaAcao
            ? `Canal: ${pedidoDiretoData.canalProximaAcao}.`
            : null
          const responsavelLabel = pedidoDiretoData.responsavelProximaAcao
            ? `Responsavel: ${pedidoDiretoData.responsavelProximaAcao}.`
            : null

          await tx.tarefa.create({
            data: {
              userId,
              titulo: `Proxima acao do pedido: ${oportunidadeDireta.titulo}`,
              descricao: [canalLabel, responsavelLabel].filter(Boolean).join(' '),
              status: 'pendente',
              prioridade: 'media',
              dataVencimento: pedidoDiretoData.proximaAcaoEm,
              clienteId: pedidoDiretoData.clienteId,
              oportunidadeId: oportunidadeDireta.id,
              notificar: true,
            },
          })
        }

        oportunidadeFinalId = oportunidadeDireta.id
        numeroPreferencial = oportunidadeDireta.numero
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

      if (numeroPreferencial !== null) {
        const pedidoComMesmoNumero = await tx.pedido.findUnique({
          where: { numero: numeroPreferencial },
          select: { id: true },
        })
        if (pedidoComMesmoNumero) {
          throw new Error('NUMERO_PEDIDO_EM_USO')
        }
      }

      const pedido = await tx.pedido.create({
        data: {
          ...(numeroPreferencial !== null ? { numero: numeroPreferencial } : {}),
          userId,
          oportunidadeId: oportunidadeFinalId,
          statusEntrega: normalizedStatusEntrega || 'pendente',
          pagamentoConfirmado,
          formaPagamento:
            normalizedFormaPagamento === undefined
              ? formaPagamentoBasePedido
              : normalizedFormaPagamento,
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

      if (!vendaConfirmada) {
        await tx.oportunidade.updateMany({
          where: { id: oportunidadeFinalId, userId },
          data: {
            status: 'pedido',
          },
        })
      }

      if (vendaConfirmada && !pedidoDiretoCriado) {
        await tx.oportunidade.updateMany({
          where: { id: oportunidadeFinalId, userId },
          data: {
            statusAnterior: 'pedido',
            status: 'fechada',
            dataFechamento: new Date(),
          },
        })
      }

      if (vendaConfirmada) {
        const valorConta = totalLiquido > 0 ? totalLiquido : valorBasePedido
        const valorContaNormalizado = roundMoney(valorConta)

        const conta = await tx.contaReceber.upsert({
          where: { pedidoId: pedido.id },
          create: {
            userId,
            pedidoId: pedido.id,
            oportunidadeId: oportunidadeFinalId,
            descricao: `Recebimento do pedido #${pedido.numero}`,
            tipo: 'receber',
            valorTotal: valorContaNormalizado,
            valorRecebido: valorContaNormalizado,
            status: 'pago',
            dataVencimento: pedido.dataEntrega || new Date(),
          },
          update: {
            oportunidadeId: oportunidadeFinalId,
            descricao: `Recebimento do pedido #${pedido.numero}`,
            tipo: 'receber',
            valorTotal: valorContaNormalizado,
            valorRecebido: valorContaNormalizado,
            status: 'pago',
            dataVencimento: pedido.dataEntrega || new Date(),
          },
          select: { id: true },
        })

        const [entradasAgg, estornosAgg] = await Promise.all([
          tx.movimentoFinanceiro.aggregate({
            where: { userId, contaReceberId: conta.id, tipo: 'entrada' },
            _sum: { valor: true },
          }),
          tx.movimentoFinanceiro.aggregate({
            where: { userId, contaReceberId: conta.id, tipo: 'estorno' },
            _sum: { valor: true },
          }),
        ])

        const entradas = roundMoney(Number(entradasAgg._sum.valor || 0))
        const estornos = roundMoney(Number(estornosAgg._sum.valor || 0))
        const netRecebido = roundMoney(entradas - estornos)
        const delta = roundMoney(valorContaNormalizado - netRecebido)

        if (delta > 0) {
          await tx.movimentoFinanceiro.create({
            data: {
              userId,
              contaReceberId: conta.id,
              tipo: 'entrada',
              valor: delta,
              observacoes: 'Recebimento automatico ao confirmar venda no pedido',
            },
          })
        }
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
            clienteId: true,
            formaPagamento: true,
            parcelas: true,
            desconto: true,
            status: true,
            probabilidade: true,
            dataFechamento: true,
            proximaAcaoEm: true,
            canalProximaAcao: true,
            responsavelProximaAcao: true,
            lembreteProximaAcao: true,
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
    if (error instanceof Error && error.message === 'NUMERO_PEDIDO_EM_USO') {
      return NextResponse.json(
        { error: 'Ja existe um pedido com esse numero. Ajuste o titulo do orcamento para manter a numeracao sincronizada.' },
        { status: 409 }
      )
    }
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
  })
}
