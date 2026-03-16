import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { addMonthsWithDay, deriveFinanceStatus } from '@/lib/financeiro/automation'
import { roundMoney } from '@/lib/money'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = new Set(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado'])
const ALLOWED_TIPO_CONTA = new Set(['receber', 'pagar'])
const ALLOWED_TIPO_MOVIMENTO = new Set(['entrada', 'saida', 'estorno'])
const ALLOWED_AMBIENTE = new Set(['geral', 'pessoal'])
const ALLOWED_AMBIENTE_QUERY = new Set(['geral', 'pessoal', 'total'])
const RECURRING_MONTHS_AHEAD = 6

async function ensurePremiumAccess(userId: string) {
  void userId
  return null
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

function parseMoney(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? roundMoney(parsed) : null
}

function parsePositiveInteger(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function parseDateInput(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function splitAmount(total: number, parts: number) {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / parts)
  const remainder = cents - base * parts

  const values: number[] = []
  for (let i = 0; i < parts; i++) {
    const value = i < remainder ? base + 1 : base
    values.push(value / 100)
  }
  return values
}

function normalizeDates(values: string[]) {
  const parsed = values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => new Date(value))

  if (parsed.some((date) => Number.isNaN(date.getTime()))) return null
  return parsed.sort((a, b) => a.getTime() - b.getTime())
}

function normalizeRelationId(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

type ContaReceberRelationIds = {
  pedidoId: string | null
  oportunidadeId: string | null
  clienteId: string | null
  fornecedorId: string | null
  funcionarioId: string | null
}

async function validateContaReceberRelations(
  db: Prisma.TransactionClient | typeof prisma,
  userId: string,
  relations: ContaReceberRelationIds
) {
  let pedidoOportunidadeId: string | null = null

  if (relations.pedidoId) {
    const pedido = await db.pedido.findFirst({
      where: { id: relations.pedidoId, userId },
      select: { id: true, oportunidadeId: true },
    })

    if (!pedido) return 'Pedido informado nao pertence ao usuario'
    pedidoOportunidadeId = pedido.oportunidadeId
  }

  if (relations.oportunidadeId) {
    const oportunidade = await db.oportunidade.findFirst({
      where: { id: relations.oportunidadeId, userId },
      select: { id: true },
    })

    if (!oportunidade) return 'Oportunidade informada nao pertence ao usuario'
  }

  if (
    pedidoOportunidadeId &&
    relations.oportunidadeId &&
    pedidoOportunidadeId !== relations.oportunidadeId
  ) {
    return 'Pedido informado nao pertence a oportunidade selecionada'
  }

  if (relations.clienteId) {
    const cliente = await db.cliente.findFirst({
      where: { id: relations.clienteId, userId },
      select: { id: true },
    })

    if (!cliente) return 'Cliente informado nao pertence ao usuario'
  }

  if (relations.fornecedorId) {
    const fornecedor = await db.fornecedor.findFirst({
      where: { id: relations.fornecedorId, userId },
      select: { id: true },
    })

    if (!fornecedor) return 'Fornecedor informado nao pertence ao usuario'
  }

  if (relations.funcionarioId) {
    const funcionario = await db.funcionario.findFirst({
      where: { id: relations.funcionarioId, userId },
      select: { id: true },
    })

    if (!funcionario) return 'Funcionario informado nao pertence ao usuario'
  }

  return null
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tipo = searchParams.get('tipo')
    const ambienteParam = searchParams.get('ambiente')
    const ambienteQuery = ambienteParam && ALLOWED_AMBIENTE_QUERY.has(ambienteParam) ? ambienteParam : 'geral'
    const paginated = searchParams.get('paginated') === 'true'

    const where: {
      userId: string
      ambiente?: string | { in: string[] }
      status?: string
      tipo?: string
    } = {
      userId,
      ...(ambienteQuery === 'total' ? { ambiente: { in: ['geral', 'pessoal'] } } : { ambiente: ambienteQuery }),
      ...(status && ALLOWED_STATUS.has(status) ? { status } : {}),
      ...(tipo && ALLOWED_TIPO_CONTA.has(tipo) ? { tipo } : {}),
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'))
      const skip = (page - 1) * limit

      const dynamicWhere: Prisma.Sql[] = [Prisma.sql`"userId" = ${userId}`]
      dynamicWhere.push(
        ambienteQuery === 'total'
          ? Prisma.sql`"ambiente" IN ('geral', 'pessoal')`
          : Prisma.sql`"ambiente" = ${ambienteQuery}`
      )
      if (where.status) {
        dynamicWhere.push(Prisma.sql`"status" = ${where.status}`)
      }
      if (where.tipo) {
        dynamicWhere.push(Prisma.sql`"tipo" = ${where.tipo}`)
      }
      const whereSql = Prisma.sql`${Prisma.join(dynamicWhere, ' AND ')}`

      const [totalRows, groupRows, statsRows] = await Promise.all([
        prisma.$queryRaw<Array<{ total: number | bigint | string }>>(Prisma.sql`
          SELECT COUNT(*) AS total
          FROM (
            SELECT COALESCE("grupoParcelaId", "id") AS "groupKey"
            FROM "contas_receber"
            WHERE ${whereSql}
            GROUP BY COALESCE("grupoParcelaId", "id")
          ) grouped
        `),
        prisma.$queryRaw<Array<{ groupKey: string }>>(Prisma.sql`
          SELECT grouped."groupKey"
          FROM (
            SELECT
              COALESCE("grupoParcelaId", "id") AS "groupKey",
              MIN(COALESCE("dataVencimento", TIMESTAMP '9999-12-31 23:59:59')) AS "sortDue",
              MAX("createdAt") AS "sortCreated"
            FROM "contas_receber"
            WHERE ${whereSql}
            GROUP BY COALESCE("grupoParcelaId", "id")
          ) grouped
          ORDER BY grouped."sortDue" ASC, grouped."sortCreated" DESC
          OFFSET ${skip}
          LIMIT ${limit}
        `),
        prisma.$queryRaw<
          Array<{
            total: number | bigint | string
            receber: number | bigint | string
            pagar: number | bigint | string
            receberEmAberto: number | string
            pagarEmAberto: number | string
          }>
        >(Prisma.sql`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE "tipo" = 'receber') AS receber,
            COUNT(*) FILTER (WHERE "tipo" = 'pagar') AS pagar,
            COALESCE(SUM(
              CASE
                WHEN "tipo" = 'receber' AND "status" NOT IN ('pago', 'cancelado')
                  THEN GREATEST("valorTotal" - "valorRecebido", 0)
                ELSE 0
              END
            ), 0) AS "receberEmAberto",
            COALESCE(SUM(
              CASE
                WHEN "tipo" = 'pagar' AND "status" NOT IN ('pago', 'cancelado')
                  THEN GREATEST("valorTotal" - "valorRecebido", 0)
                ELSE 0
              END
            ), 0) AS "pagarEmAberto"
          FROM "contas_receber"
          WHERE "userId" = ${userId}
            AND ${ambienteQuery === 'total' ? Prisma.sql`"ambiente" IN ('geral', 'pessoal')` : Prisma.sql`"ambiente" = ${ambienteQuery}`}
        `),
      ])

      const total = Number(totalRows[0]?.total || 0)
      const groupKeys = groupRows.map((row) => row.groupKey).filter((value) => value.length > 0)

      let contas: Array<{
        id: string
      }> = []

      if (groupKeys.length > 0) {
        contas = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id"
          FROM "contas_receber"
          WHERE ${whereSql}
            AND COALESCE("grupoParcelaId", "id") IN (${Prisma.join(groupKeys)})
        `)
      }

      const contaIds = contas.map((row) => row.id)
      const contasDetalhadas =
        contaIds.length > 0
          ? await prisma.contaReceber.findMany({
              where: {
                userId,
                id: { in: contaIds },
              },
              include: {
                pedido: {
                  select: {
                    id: true,
                    oportunidade: {
                      select: {
                        titulo: true,
                        cliente: {
                          select: { nome: true },
                        },
                      },
                    },
                  },
                },
                cliente: { select: { id: true, nome: true } },
                fornecedor: { select: { id: true, nome: true } },
                funcionario: { select: { id: true, nome: true } },
              },
              orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'desc' }],
            })
          : []

      const normalized = contasDetalhadas.map((conta) => ({
        ...conta,
        status: deriveFinanceStatus({
          status: conta.status,
          valorTotal: conta.valorTotal,
          valorRecebido: conta.valorRecebido,
          dataVencimento: conta.dataVencimento,
        }),
      }))

      const stats = statsRows[0]
      return NextResponse.json({
        data: normalized,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        stats: {
          total: Number(stats?.total || 0),
          receber: Number(stats?.receber || 0),
          pagar: Number(stats?.pagar || 0),
          receberEmAberto: Number(stats?.receberEmAberto || 0),
          pagarEmAberto: Number(stats?.pagarEmAberto || 0),
        },
      })
    }

    const limit = parseLimit(searchParams.get('limit'))
    const contas = await prisma.contaReceber.findMany({
      where,
      include: {
        pedido: {
          select: {
            id: true,
            oportunidade: {
              select: {
                titulo: true,
                cliente: {
                  select: { nome: true },
                },
              },
            },
          },
        },
        cliente: { select: { id: true, nome: true } },
        fornecedor: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true } },
        movimentos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const normalized = contas.map((conta) => ({
      ...conta,
      status: deriveFinanceStatus({
        status: conta.status,
        valorTotal: conta.valorTotal,
        valorRecebido: conta.valorRecebido,
        dataVencimento: conta.dataVencimento,
      }),
    }))

      return NextResponse.json(normalized)
    } catch (error) {
      console.error('Erro ao listar contas financeiras:', error)
      return NextResponse.json({ error: 'Erro ao listar contas financeiras' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const body = await request.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
      }

      const payload = body as Record<string, unknown>
    const descricao = typeof payload.descricao === 'string' ? payload.descricao.trim() : ''
    if (!descricao) {
      return NextResponse.json({ error: 'Nome da conta e obrigatorio' }, { status: 400 })
    }
    const valorTotal = parseMoney(payload.valorTotal)
    const valorRecebido = parseMoney(payload.valorRecebido ?? 0)

    if (valorTotal === null || valorRecebido === null) {
      return NextResponse.json({ error: 'Valores invalidos' }, { status: 400 })
    }

    const tipoInput = typeof payload.tipo === 'string' ? payload.tipo : 'receber'
    const tipo = ALLOWED_TIPO_CONTA.has(tipoInput) ? tipoInput : 'receber'
    const ambienteInput = typeof payload.ambiente === 'string' ? payload.ambiente : 'geral'
    const ambiente = ALLOWED_AMBIENTE.has(ambienteInput) ? ambienteInput : 'geral'

    const autoDebito = payload.autoDebito === true && tipo === 'pagar'
    const recorrenteMensal = payload.recorrenteMensal === true

    const statusInput = typeof payload.status === 'string' ? payload.status : 'pendente'
    const statusBase = ALLOWED_STATUS.has(statusInput) ? statusInput : 'pendente'

    const dataVencimento = parseDateInput(payload.dataVencimento)
    if (payload.dataVencimento !== undefined && payload.dataVencimento !== null && !dataVencimento) {
      return NextResponse.json({ error: 'Data de vencimento invalida' }, { status: 400 })
    }

    const datasParcelasRaw = Array.isArray(payload.parcelasDatas)
      ? payload.parcelasDatas.filter((item): item is string => typeof item === 'string')
      : []

    const datasParcelas = normalizeDates(datasParcelasRaw)
    if (datasParcelasRaw.length > 0 && !datasParcelas) {
      return NextResponse.json({ error: 'Datas de parcelas invalidas' }, { status: 400 })
    }

    const parcelas = parsePositiveInteger(payload.parcelas)
    const intervaloDias = parsePositiveInteger(payload.intervaloDias) ?? 30

    if ((parcelas !== null && parcelas > 1 && valorRecebido > 0) || (recorrenteMensal && valorRecebido > 0)) {
      return NextResponse.json(
        { error: 'Nao e permitido valor recebido inicial para contas parceladas ou recorrentes' },
        { status: 400 }
      )
    }
    if (!recorrenteMensal && (parcelas === null || parcelas <= 1) && valorRecebido > valorTotal) {
      return NextResponse.json(
        { error: 'Valor recebido nao pode ser maior que o valor total' },
        { status: 400 }
      )
    }

    if (recorrenteMensal && !dataVencimento) {
      return NextResponse.json(
        { error: 'Informe a primeira data para recorrencia mensal' },
        { status: 400 }
      )
    }
    if (recorrenteMensal && parcelas !== null && parcelas > 1) {
      return NextResponse.json(
        { error: 'Nao e permitido combinar mensal automatico com parcelado. Escolha apenas uma opcao.' },
        { status: 400 }
      )
    }

    let scheduleDates: Date[] = []
    if (recorrenteMensal && dataVencimento) {
      const dia = dataVencimento.getDate()
      scheduleDates = Array.from({ length: RECURRING_MONTHS_AHEAD }, (_, index) =>
        addMonthsWithDay(dataVencimento, index, dia)
      )
    } else if (datasParcelas && datasParcelas.length > 0) {
      scheduleDates = datasParcelas
    } else if (parcelas !== null && parcelas > 1) {
      if (!dataVencimento) {
        return NextResponse.json(
          { error: 'Informe a primeira data para gerar parcelas' },
          { status: 400 }
        )
      }
      scheduleDates = Array.from({ length: parcelas }, (_, index) => {
        const date = new Date(dataVencimento)
        date.setDate(date.getDate() + intervaloDias * index)
        return date
      })
    } else {
      scheduleDates = dataVencimento ? [dataVencimento] : []
    }

    const totalParcelas = Math.max(1, scheduleDates.length || 1)
    const pedidoId = normalizeRelationId(payload.pedidoId)
    const oportunidadeId = normalizeRelationId(payload.oportunidadeId)
    const clienteId = normalizeRelationId(payload.clienteId)
    const fornecedorId = normalizeRelationId(payload.fornecedorId)
    const funcionarioId = normalizeRelationId(payload.funcionarioId)

    if ((totalParcelas > 1 || recorrenteMensal) && pedidoId) {
      return NextResponse.json(
        { error: 'Nao e permitido vincular pedido em lancamento parcelado ou recorrente' },
        { status: 400 }
      )
    }

    const relationError = await validateContaReceberRelations(prisma, userId, {
      pedidoId,
      oportunidadeId,
      clienteId,
      fornecedorId,
      funcionarioId,
    })
    if (relationError) {
      return NextResponse.json({ error: relationError }, { status: 400 })
    }

    const valores = recorrenteMensal
      ? Array.from({ length: totalParcelas }, () => valorTotal)
      : splitAmount(valorTotal, totalParcelas)
    const grupoParcelaId = totalParcelas > 1 || recorrenteMensal ? randomUUID() : null
    const recorrenciaDiaVencimento =
      recorrenteMensal && dataVencimento ? dataVencimento.getDate() : null

    const multaPorAtrasoPercentual = payload.multaPorAtrasoPercentual !== undefined ? parseMoney(payload.multaPorAtrasoPercentual) : null
    const multaPorAtrasoValor = payload.multaPorAtrasoValor !== undefined ? parseMoney(payload.multaPorAtrasoValor) : null
    const multaPorAtrasoPeriodo = typeof payload.multaPorAtrasoPeriodo === 'string' && ['dia', 'semana', 'mes'].includes(payload.multaPorAtrasoPeriodo) ? payload.multaPorAtrasoPeriodo : null

    const created = await prisma.$transaction(async (tx) => {
      const contasCriadas = []

      for (let index = 0; index < totalParcelas; index++) {
        const valorParcela = roundMoney(valores[index])
        const dataParcela = scheduleDates[index] ?? null
        const valorInicial = totalParcelas > 1 || recorrenteMensal ? 0 : roundMoney(valorRecebido)

        const conta = await tx.contaReceber.create({
          data: {
            userId,
            pedidoId,
            oportunidadeId,
            clienteId,
            fornecedorId,
            funcionarioId,
            ambiente,
            tipo,
            descricao,
            valorTotal: valorParcela,
            valorRecebido: valorInicial,
            autoDebito,
            grupoParcelaId,
            numeroParcela: totalParcelas > 1 ? index + 1 : null,
            totalParcelas: recorrenteMensal ? null : totalParcelas > 1 ? totalParcelas : null,
            dataVencimento: dataParcela,
            status: deriveFinanceStatus({
              status: statusBase,
              valorTotal: valorParcela,
              valorRecebido: valorInicial,
              dataVencimento: dataParcela,
            }),
            recorrenteMensal,
            recorrenciaAtiva: recorrenteMensal,
            recorrenciaDiaVencimento,
            ...(multaPorAtrasoPercentual != null ? { multaPorAtrasoPercentual } : {}),
            ...(multaPorAtrasoValor != null ? { multaPorAtrasoValor } : {}),
            ...(multaPorAtrasoPeriodo != null ? { multaPorAtrasoPeriodo } : {}),
          },
        })

        if (valorInicial > 0) {
          await tx.movimentoFinanceiro.create({
            data: {
              userId,
              contaReceberId: conta.id,
              tipo: tipo === 'pagar' ? 'saida' : 'entrada',
              valor: valorInicial,
              observacoes: 'Movimento inicial gerado na criacao da conta',
            },
          })
        }

        contasCriadas.push(conta)
      }

      return contasCriadas
    })

    if (recorrenteMensal) {
      return NextResponse.json(
        {
          recorrenteMensal: true,
          lancamentosCriados: created.length,
          grupoParcelaId,
          contas: created,
        },
        { status: 201 }
      )
    }

    if (created.length === 1) {
      return NextResponse.json(created[0], { status: 201 })
    }

      return NextResponse.json(
        {
          parcelasCriadas: created.length,
          grupoParcelaId,
          contas: created,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Erro ao criar conta financeira:', error)
      return NextResponse.json({ error: 'Erro ao criar conta financeira' }, { status: 500 })
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const premiumDenied = await ensurePremiumAccess(userId)
      if (premiumDenied) return premiumDenied

      const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const id = typeof payload.id === 'string' ? payload.id.trim() : ''
    if (!id) {
      return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
    }

    const existing = await prisma.contaReceber.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Conta nao encontrada' }, { status: 404 })
    }

    const tipoInput =
      typeof payload.tipo === 'string' && ALLOWED_TIPO_CONTA.has(payload.tipo)
        ? payload.tipo
        : existing.tipo
    const ambienteInput =
      typeof payload.ambiente === 'string' && ALLOWED_AMBIENTE.has(payload.ambiente)
        ? payload.ambiente
        : existing.ambiente

    const valorRecebidoRaw =
      payload.valorRecebido !== undefined ? parseMoney(payload.valorRecebido) : roundMoney(existing.valorRecebido)
    let valorTotal =
      payload.valorTotal !== undefined ? parseMoney(payload.valorTotal) : roundMoney(existing.valorTotal)

    const valorTaxa = payload.valorTaxa !== undefined ? parseMoney(payload.valorTaxa) : null
    if (valorTaxa !== null && valorTaxa > 0) {
      const base = valorTotal ?? existing.valorTotal
      valorTotal = roundMoney(base + valorTaxa)
    }
    const dataVencimento =
      payload.dataVencimento !== undefined
        ? payload.dataVencimento
          ? new Date(String(payload.dataVencimento))
          : null
        : existing.dataVencimento
    const statusInput =
      typeof payload.status === 'string' && ALLOWED_STATUS.has(payload.status)
        ? payload.status
        : existing.status

    if (valorTotal === null || valorRecebidoRaw === null) {
      return NextResponse.json({ error: 'Valores invalidos' }, { status: 400 })
    }
    const valorRecebido = roundMoney(Math.min(valorTotal, valorRecebidoRaw))
    if (dataVencimento && Number.isNaN(dataVencimento.getTime())) {
      return NextResponse.json({ error: 'Data de vencimento invalida' }, { status: 400 })
    }

    const status = deriveFinanceStatus({
      status: statusInput,
      valorTotal,
      valorRecebido,
      dataVencimento,
    })

    const aplicarNoGrupoRecorrente =
      payload.aplicarNoGrupoRecorrente === true &&
      existing.recorrenteMensal &&
      typeof existing.grupoParcelaId === 'string' &&
      existing.grupoParcelaId.length > 0

    const recorrenciaAtivaInput =
      payload.recorrenciaAtiva !== undefined ? payload.recorrenciaAtiva === true : existing.recorrenciaAtiva
    const recorrenciaDiaInput =
      dataVencimento && existing.recorrenteMensal
        ? dataVencimento.getDate()
        : existing.recorrenciaDiaVencimento

    const valorMovimento =
      payload.valorMovimento !== undefined ? parseMoney(payload.valorMovimento) : null
    if (payload.registrarMovimento === true && (valorMovimento === null || valorMovimento <= 0)) {
      return NextResponse.json({ error: 'Valor de movimento invalido' }, { status: 400 })
    }

    const clienteId =
      payload.clienteId !== undefined ? normalizeRelationId(payload.clienteId) : existing.clienteId
    const fornecedorId =
      payload.fornecedorId !== undefined ? normalizeRelationId(payload.fornecedorId) : existing.fornecedorId
    const funcionarioId =
      payload.funcionarioId !== undefined ? normalizeRelationId(payload.funcionarioId) : existing.funcionarioId

    const relationError = await validateContaReceberRelations(prisma, userId, {
      pedidoId: existing.pedidoId,
      oportunidadeId: existing.oportunidadeId,
      clienteId,
      fornecedorId,
      funcionarioId,
    })
    if (relationError) {
      return NextResponse.json({ error: relationError }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (aplicarNoGrupoRecorrente) {
        await tx.contaReceber.updateMany({
          where: {
            userId,
            grupoParcelaId: existing.grupoParcelaId!,
            recorrenteMensal: true,
            status: { in: ['pendente', 'parcial', 'atrasado'] },
          },
          data: {
            ambiente: ambienteInput,
            tipo: tipoInput,
            descricao:
              payload.descricao !== undefined
                ? typeof payload.descricao === 'string'
                  ? payload.descricao
                  : null
                : existing.descricao,
            valorTotal,
            autoDebito:
              payload.autoDebito !== undefined
                ? payload.autoDebito === true && tipoInput === 'pagar'
                : existing.autoDebito,
            recorrenciaAtiva: recorrenciaAtivaInput,
            recorrenciaDiaVencimento: recorrenciaDiaInput,
          },
        })
      }

      const conta = await tx.contaReceber.update({
        where: { id: existing.id },
        data: {
          ambiente: ambienteInput,
          tipo: tipoInput,
          descricao:
            payload.descricao !== undefined
              ? typeof payload.descricao === 'string'
                ? payload.descricao
                : null
              : existing.descricao,
          valorTotal,
          valorRecebido,
          dataVencimento,
          autoDebito:
            payload.autoDebito !== undefined
              ? payload.autoDebito === true && tipoInput === 'pagar'
              : existing.autoDebito,
          status,
          recorrenciaAtiva: recorrenciaAtivaInput,
          recorrenciaDiaVencimento: recorrenciaDiaInput,
          clienteId,
          fornecedorId,
          funcionarioId,
        },
      })

      if (payload.registrarMovimento === true && valorMovimento !== null) {
        let tipoMovimento =
          conta.tipo === 'pagar'
            ? 'saida'
            : 'entrada'

        if (
          typeof payload.tipoMovimento === 'string' &&
          ALLOWED_TIPO_MOVIMENTO.has(payload.tipoMovimento)
        ) {
          tipoMovimento = payload.tipoMovimento
        }

        await tx.movimentoFinanceiro.create({
          data: {
            userId,
            contaReceberId: existing.id,
            tipo: tipoMovimento,
            valor: valorMovimento,
            observacoes:
              typeof payload.observacoesMovimento === 'string'
                ? payload.observacoesMovimento
                : null,
          },
        })
      }

      return conta
    })

      return NextResponse.json(updated)
    } catch (error) {
      console.error('Erro ao atualizar conta financeira:', error)
      return NextResponse.json({ error: 'Erro ao atualizar conta financeira' }, { status: 500 })
    }
  })
}
