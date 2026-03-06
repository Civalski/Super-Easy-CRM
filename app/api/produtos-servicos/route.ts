import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ITEM_TYPES = ['produto', 'servico'] as const
const UNIT_TYPES = ['UN', 'CX', 'KG', 'M', 'M2', 'M3', 'L', 'HORA', 'DIARIA', 'MES'] as const
const AUTO_CODE_WIDTH = 5
const MAX_AUTO_CODE = Number('9'.repeat(AUTO_CODE_WIDTH))
const produtoServicoFieldSet = new Set(
  (Prisma.dmmf.datamodel.models.find((model) => model.name === 'ProdutoServico')?.fields ?? []).map(
    (field) => field.name
  )
)

function hasProdutoField(field: string) {
  return produtoServicoFieldSet.has(field)
}

function sanitizeProdutoData(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => hasProdutoField(key) && value !== undefined
    )
  )
}

function parsePrice(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null
}

function parseMinutes(value: unknown): number | null | undefined {
  if (value === undefined) return null
  if (value === null || value === '') return null
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : undefined
}

function parsePositiveInt(value: unknown): number | null | undefined {
  if (value === undefined) return null
  if (value === null || value === '') return null
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : undefined
}

function parseOptionalText(value: unknown, max = 120): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  if (!cleaned) return null
  return cleaned.slice(0, max)
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

async function getNextAutoCode(userId: string): Promise<string | null> {
  const regex = /^(\d+)$/
  const existingCodes = await prisma.produtoServico.findMany({
    where: {
      userId,
    },
    select: {
      codigo: true,
    },
  })

  let maxSequence = 0
  for (const item of existingCodes) {
    if (!item.codigo) continue
    const match = item.codigo.match(regex)
    if (!match) continue
    const sequence = Number(match[1])
    if (Number.isInteger(sequence) && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  const nextSequence = maxSequence + 1
  if (nextSequence > MAX_AUTO_CODE) {
    return null
  }

  return String(nextSequence).padStart(AUTO_CODE_WIDTH, '0')
}

function hasField(payload: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key)
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('ativo')?.trim()
    const tipo = searchParams.get('tipo')?.trim().toLowerCase()
    const proximoCodigo = searchParams.get('proximoCodigo')?.trim().toLowerCase()
    const paginated = searchParams.get('paginated') === 'true'
    const categoria = searchParams.get('categoria')?.trim()
    const marca = searchParams.get('marca')?.trim()
    const busca = searchParams.get('busca')?.trim()

    if (tipo && !ITEM_TYPES.includes(tipo as (typeof ITEM_TYPES)[number])) {
      return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
    }

    if (proximoCodigo === 'true') {
      const codigo = await getNextAutoCode(userId)
      if (!codigo) {
        return NextResponse.json(
          { error: 'Limite maximo de codigos automaticos atingido' },
          { status: 409 }
        )
      }
      return NextResponse.json({ codigo })
    }

    const searchOr: Array<Record<string, unknown>> = []
    if (busca && hasProdutoField('nome')) {
      searchOr.push({ nome: { contains: busca, mode: 'insensitive' } })
    }
    if (busca && hasProdutoField('codigo')) {
      searchOr.push({ codigo: { contains: busca, mode: 'insensitive' } })
    }
    if (busca && hasProdutoField('marca')) {
      searchOr.push({ marca: { contains: busca, mode: 'insensitive' } })
    }
    if (busca && hasProdutoField('descricao')) {
      searchOr.push({ descricao: { contains: busca, mode: 'insensitive' } })
    }

    const where: Prisma.ProdutoServicoWhereInput = {
      userId,
      ...(onlyActive === 'true' ? { ativo: true } : {}),
      ...(onlyActive === 'false' ? { ativo: false } : {}),
      ...(tipo ? { tipo } : {}),
      ...(categoria && hasProdutoField('categoria')
        ? {
            categoria: {
              contains: categoria,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(marca && hasProdutoField('marca')
        ? {
            marca: {
              contains: marca,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(searchOr.length > 0
        ? {
            OR: searchOr,
          }
        : {}),
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'))
      const skip = (page - 1) * limit

      const [items, total] = await Promise.all([
        prisma.produtoServico.findMany({
          where,
          orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.produtoServico.count({ where }),
      ])

      const [statsTotal, statsAtivos, statsProdutos, statsServicos, lowStockRows] = await Promise.all([
        prisma.produtoServico.count({ where: { userId } }),
        prisma.produtoServico.count({ where: { userId, ativo: true } }),
        prisma.produtoServico.count({ where: { userId, tipo: 'produto' } }),
        prisma.produtoServico.count({ where: { userId, tipo: 'servico' } }),
        prisma.$queryRaw<Array<{ total: number | bigint | string }>>(
          Prisma.sql`
            SELECT COUNT(*) AS total
            FROM "produtos_servicos"
            WHERE "userId" = ${userId}
              AND "tipo" = 'produto'
              AND "controlaEstoque" = true
              AND COALESCE("estoqueAtual", 0) <= COALESCE("estoqueMinimo", 0)
          `
        ),
      ])

      const lowStockRaw = lowStockRows[0]?.total
      const estoqueBaixo =
        typeof lowStockRaw === 'bigint' ? Number(lowStockRaw) : Number(lowStockRaw || 0)

      return NextResponse.json({
        data: items,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        stats: {
          total: statsTotal,
          ativos: statsAtivos,
          produtos: statsProdutos,
          servicos: statsServicos,
          estoqueBaixo,
        },
      })
    }

    const items = await prisma.produtoServico.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    })

    return NextResponse.json(items)
    } catch (error) {
      console.error('Erro ao listar produtos/servicos:', error)
      return NextResponse.json(
        { error: 'Erro ao listar produtos/servicos' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const nome = typeof payload.nome === 'string' ? payload.nome.trim() : ''
    const tipoInput = typeof payload.tipo === 'string' ? payload.tipo.trim().toLowerCase() : 'servico'
    const categoria = parseOptionalText(payload.categoria)
    const marca = parseOptionalText(payload.marca)
    const codigoBarras = parseOptionalText(payload.codigoBarras, 80)
    const descricao = parseOptionalText(payload.descricao, 400)
    const observacoesInternas = parseOptionalText(payload.observacoesInternas, 1000)
    const unidadeRaw = typeof payload.unidade === 'string' ? payload.unidade.trim().toUpperCase() : null
    const unidade = unidadeRaw || (tipoInput === 'servico' ? 'HORA' : 'UN')
    const precoPadrao = parsePrice(payload.precoPadrao)
    const custoPadrao = parsePrice(payload.custoPadrao ?? 0)
    const comissaoPercentual = parsePrice(payload.comissaoPercentual ?? 0)
    const controlaEstoqueInput =
      typeof payload.controlaEstoque === 'boolean'
        ? payload.controlaEstoque
        : tipoInput === 'produto'
    const estoqueAtual = parsePrice(payload.estoqueAtual ?? 0)
    const estoqueMinimo = parsePrice(payload.estoqueMinimo ?? 0)
    const tempoPadraoMinutos = parseMinutes(payload.tempoPadraoMinutos)
    const garantiaDias = parsePositiveInt(payload.garantiaDias)
    const prazoEntregaDias = parsePositiveInt(payload.prazoEntregaDias)

    if (!nome) {
      return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })
    }

    if (!['produto', 'servico'].includes(tipoInput)) {
      return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
    }

    if (!UNIT_TYPES.includes(unidade as (typeof UNIT_TYPES)[number])) {
      return NextResponse.json({ error: 'Unidade invalida' }, { status: 400 })
    }

    if (precoPadrao === null) {
      return NextResponse.json({ error: 'Preco padrao invalido' }, { status: 400 })
    }

    if (custoPadrao === null) {
      return NextResponse.json({ error: 'Custo padrao invalido' }, { status: 400 })
    }

    if (comissaoPercentual === null || comissaoPercentual > 100) {
      return NextResponse.json({ error: 'Comissao invalida (0-100)' }, { status: 400 })
    }

    if (estoqueAtual === null || estoqueMinimo === null) {
      return NextResponse.json({ error: 'Estoque invalido' }, { status: 400 })
    }

    if (tempoPadraoMinutos === undefined) {
      return NextResponse.json({ error: 'Tempo padrao invalido' }, { status: 400 })
    }

    if (garantiaDias === undefined || prazoEntregaDias === undefined) {
      return NextResponse.json({ error: 'Garantia ou prazo de entrega invalido' }, { status: 400 })
    }

    const controlaEstoque = tipoInput === 'servico' ? false : controlaEstoqueInput

    const tipo = tipoInput as 'produto' | 'servico'
    let created: Awaited<ReturnType<typeof prisma.produtoServico.create>> | null = null

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const codigo = await getNextAutoCode(userId)
        if (!codigo) {
          return NextResponse.json(
            { error: 'Limite maximo de codigos automaticos atingido' },
            { status: 409 }
          )
        }
        created = await prisma.produtoServico.create({
          data: sanitizeProdutoData({
            userId,
            codigo,
            nome,
            categoria,
            marca,
            codigoBarras,
            tipo: tipoInput,
            unidade,
            descricao,
            observacoesInternas,
            precoPadrao,
            custoPadrao,
            comissaoPercentual,
            controlaEstoque,
            estoqueAtual: controlaEstoque ? estoqueAtual : 0,
            estoqueMinimo: controlaEstoque ? estoqueMinimo : 0,
            tempoPadraoMinutos: tipoInput === 'servico' ? tempoPadraoMinutos : null,
            garantiaDias,
            prazoEntregaDias,
            ativo: payload.ativo === false ? false : true,
          }) as never,
        })
        break
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue
        }
        throw error
      }
    }

    if (!created) {
      return NextResponse.json(
        { error: 'Nao foi possivel gerar codigo automatico. Tente novamente.' },
        { status: 409 }
      )
    }

      return NextResponse.json(created, { status: 201 })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'Codigo ja cadastrado para este usuario' }, { status: 409 })
      }
      console.error('Erro ao criar produto/servico:', error)
      return NextResponse.json(
        { error: 'Erro ao criar produto/servico' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const id = typeof payload.id === 'string' ? payload.id.trim() : ''

    if (!id) {
      return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
    }

    const existing = await prisma.produtoServico.findFirst({
      where: { id, userId },
      select: { id: true, tipo: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 })
    }

    const hasNome = hasField(payload, 'nome')
    const hasTipo = hasField(payload, 'tipo')
    const hasCodigo = hasField(payload, 'codigo')
    const hasCategoria = hasField(payload, 'categoria')
    const hasMarca = hasField(payload, 'marca')
    const hasCodigoBarras = hasField(payload, 'codigoBarras')
    const hasDescricao = hasField(payload, 'descricao')
    const hasObservacoesInternas = hasField(payload, 'observacoesInternas')
    const hasUnidade = hasField(payload, 'unidade')
    const hasPrecoPadrao = hasField(payload, 'precoPadrao')
    const hasCustoPadrao = hasField(payload, 'custoPadrao')
    const hasComissaoPercentual = hasField(payload, 'comissaoPercentual')
    const hasControlaEstoque = hasField(payload, 'controlaEstoque')
    const hasEstoqueAtual = hasField(payload, 'estoqueAtual')
    const hasEstoqueMinimo = hasField(payload, 'estoqueMinimo')
    const hasTempoPadraoMinutos = hasField(payload, 'tempoPadraoMinutos')
    const hasGarantiaDias = hasField(payload, 'garantiaDias')
    const hasPrazoEntregaDias = hasField(payload, 'prazoEntregaDias')

    const nome =
      hasNome
        ? typeof payload.nome === 'string'
          ? payload.nome.trim()
          : null
        : undefined
    const tipoRaw =
      hasTipo
        ? typeof payload.tipo === 'string'
          ? payload.tipo.trim().toLowerCase()
          : null
        : undefined
    if (hasCodigo && hasProdutoField('codigo')) {
      return NextResponse.json(
        { error: 'Codigo e gerado automaticamente e nao pode ser alterado' },
        { status: 400 }
      )
    }
    const categoria = hasCategoria ? parseOptionalText(payload.categoria) : undefined
    const marca = hasMarca ? parseOptionalText(payload.marca) : undefined
    const codigoBarras = hasCodigoBarras ? parseOptionalText(payload.codigoBarras, 80) : undefined
    const descricao = hasDescricao ? parseOptionalText(payload.descricao, 400) : undefined
    const observacoesInternas = hasObservacoesInternas ? parseOptionalText(payload.observacoesInternas, 1000) : undefined
    const unidade =
      hasUnidade && typeof payload.unidade === 'string' ? payload.unidade.trim().toUpperCase() : undefined
    const precoPadrao =
      hasPrecoPadrao ? parsePrice(payload.precoPadrao) : undefined
    const custoPadrao = hasCustoPadrao ? parsePrice(payload.custoPadrao) : undefined
    const comissaoPercentual = hasComissaoPercentual ? parsePrice(payload.comissaoPercentual) : undefined
    const controlaEstoqueRaw = hasControlaEstoque ? payload.controlaEstoque === true : undefined
    const estoqueAtual = hasEstoqueAtual ? parsePrice(payload.estoqueAtual) : undefined
    const estoqueMinimo = hasEstoqueMinimo ? parsePrice(payload.estoqueMinimo) : undefined
    const tempoPadraoMinutos = hasTempoPadraoMinutos ? parseMinutes(payload.tempoPadraoMinutos) : undefined
    const garantiaDias = hasGarantiaDias ? parsePositiveInt(payload.garantiaDias) : undefined
    const prazoEntregaDias = hasPrazoEntregaDias ? parsePositiveInt(payload.prazoEntregaDias) : undefined
    const nextTipo = (tipoRaw as 'produto' | 'servico' | undefined) ?? existing.tipo
    const nextControlaEstoque = nextTipo === 'servico' ? false : controlaEstoqueRaw

    if (nome !== undefined && !nome) {
      return NextResponse.json({ error: 'Nome invalido' }, { status: 400 })
    }
    if (tipoRaw !== undefined && !['produto', 'servico'].includes(tipoRaw || '')) {
      return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
    }
    if (hasUnidade && (!unidade || !UNIT_TYPES.includes(unidade as (typeof UNIT_TYPES)[number]))) {
      return NextResponse.json({ error: 'Unidade invalida' }, { status: 400 })
    }
    if (precoPadrao === null) {
      return NextResponse.json({ error: 'Preco padrao invalido' }, { status: 400 })
    }
    if (custoPadrao === null) {
      return NextResponse.json({ error: 'Custo padrao invalido' }, { status: 400 })
    }
    if (comissaoPercentual === null || (comissaoPercentual !== undefined && comissaoPercentual > 100)) {
      return NextResponse.json({ error: 'Comissao invalida (0-100)' }, { status: 400 })
    }
    if (estoqueAtual === null || estoqueMinimo === null) {
      return NextResponse.json({ error: 'Estoque invalido' }, { status: 400 })
    }
    if (hasTempoPadraoMinutos && tempoPadraoMinutos === undefined) {
      return NextResponse.json({ error: 'Tempo padrao invalido' }, { status: 400 })
    }
    if (hasGarantiaDias && garantiaDias === undefined) {
      return NextResponse.json({ error: 'Garantia invalida' }, { status: 400 })
    }
    if (hasPrazoEntregaDias && prazoEntregaDias === undefined) {
      return NextResponse.json({ error: 'Prazo de entrega invalido' }, { status: 400 })
    }

    const updated = await prisma.produtoServico.update({
      where: { id },
      data: sanitizeProdutoData({
        nome: nome === undefined ? undefined : nome,
        tipo:
          tipoRaw === undefined
            ? undefined
            : (tipoRaw as 'produto' | 'servico'),
        categoria: categoria === undefined ? undefined : categoria,
        marca: marca === undefined ? undefined : marca,
        codigoBarras: codigoBarras === undefined ? undefined : codigoBarras,
        unidade: unidade === undefined ? undefined : unidade,
        descricao: descricao === undefined ? undefined : descricao,
        observacoesInternas:
          observacoesInternas === undefined ? undefined : observacoesInternas,
        precoPadrao: precoPadrao === undefined ? undefined : precoPadrao,
        custoPadrao: custoPadrao === undefined ? undefined : custoPadrao,
        comissaoPercentual:
          comissaoPercentual === undefined ? undefined : comissaoPercentual,
        controlaEstoque:
          nextTipo === 'servico'
            ? hasTipo || hasControlaEstoque
              ? false
              : undefined
            : hasControlaEstoque
              ? nextControlaEstoque
              : undefined,
        estoqueAtual:
          nextTipo === 'servico'
            ? hasTipo || hasEstoqueAtual || hasControlaEstoque
              ? 0
              : undefined
            : hasControlaEstoque && nextControlaEstoque === false
              ? 0
            : hasEstoqueAtual
              ? estoqueAtual
              : undefined,
        estoqueMinimo:
          nextTipo === 'servico'
            ? hasTipo || hasEstoqueMinimo || hasControlaEstoque
              ? 0
              : undefined
            : hasControlaEstoque && nextControlaEstoque === false
              ? 0
            : hasEstoqueMinimo
              ? estoqueMinimo
              : undefined,
        tempoPadraoMinutos:
          nextTipo === 'servico'
            ? tempoPadraoMinutos === undefined
              ? undefined
              : tempoPadraoMinutos
            : hasTipo || hasTempoPadraoMinutos
              ? null
              : undefined,
        garantiaDias: garantiaDias === undefined ? undefined : garantiaDias,
        prazoEntregaDias:
          prazoEntregaDias === undefined ? undefined : prazoEntregaDias,
        ativo: payload.ativo !== undefined ? payload.ativo === true : undefined,
      }) as never,
    })

      return NextResponse.json(updated)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'Codigo ja cadastrado para este usuario' }, { status: 409 })
      }
      console.error('Erro ao atualizar produto/servico:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar produto/servico' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')?.trim()
      if (!id) {
        return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 })
      }

      const deleted = await prisma.produtoServico.deleteMany({
        where: { id, userId },
      })

      if (deleted.count === 0) {
        return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir produto/servico:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir produto/servico' },
        { status: 500 }
      )
    }
  })
}
