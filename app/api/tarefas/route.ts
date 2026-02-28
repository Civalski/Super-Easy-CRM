import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensureDatabaseInitialized } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ALLOWED_TAREFA_STATUS = new Set(['pendente', 'em_andamento', 'concluida'])
const ALLOWED_TAREFA_PRIORIDADE = new Set(['baixa', 'media', 'alta'])

function parseLimit(value: string | null, fallback = 18, max = 100) {
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

function parseStatusFilter(value: string | null): string[] {
  if (!value) return []

  const statuses = Array.from(
    new Set(
      value
        .split(',')
        .map((status) => status.trim().toLowerCase())
        .filter((status) => status !== '')
    )
  )

  return statuses
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paginated = searchParams.get('paginated') === 'true'
    const statusList = parseStatusFilter(searchParams.get('status'))
    const prioridade = searchParams.get('prioridade')?.trim().toLowerCase()

    if (statusList.some((status) => !ALLOWED_TAREFA_STATUS.has(status))) {
      return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
    }

    if (prioridade && !ALLOWED_TAREFA_PRIORIDADE.has(prioridade)) {
      return NextResponse.json({ error: 'Prioridade invalida' }, { status: 400 })
    }

    const where: {
      userId: string
      status?: string | { in: string[] }
      prioridade?: string
    } = { userId }

    if (statusList.length === 1) {
      where.status = statusList[0]
    } else if (statusList.length > 1) {
      where.status = { in: statusList }
    }

    if (prioridade) {
      where.prioridade = prioridade
    }

    if (paginated) {
      const page = parsePage(searchParams.get('page'))
      const limit = parseLimit(searchParams.get('limit'))
      const skip = (page - 1) * limit

      const [tarefas, total, pendentesCount, concluidasCount] = await Promise.all([
        prisma.tarefa.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.tarefa.count({ where }),
        prisma.tarefa.count({
          where: {
            userId,
            status: {
              in: ['pendente', 'em_andamento'],
            },
          },
        }),
        prisma.tarefa.count({
          where: {
            userId,
            status: 'concluida',
          },
        }),
      ])

      return NextResponse.json({
        data: tarefas,
        meta: {
          total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
        counts: {
          pendentes: pendentesCount,
          concluidas: concluidasCount,
        },
      })
    }

    const tarefas = await prisma.tarefa.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
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

    const rawBody = await request.json().catch(() => null)
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
    }

    const body = rawBody as Record<string, unknown>
    const {
      titulo,
      descricao,
      status,
      prioridade,
      dataVencimento,
      clienteId,
      oportunidadeId,
      notificar,
    } = body

    if (typeof titulo !== 'string' || titulo.trim() === '') {
      return NextResponse.json({ error: 'Titulo e obrigatorio' }, { status: 400 })
    }

    const normalizedStatus =
      typeof status === 'string' ? status.trim().toLowerCase() : 'pendente'
    if (!ALLOWED_TAREFA_STATUS.has(normalizedStatus)) {
      return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
    }

    const normalizedPrioridade =
      typeof prioridade === 'string' ? prioridade.trim().toLowerCase() : 'media'
    if (!ALLOWED_TAREFA_PRIORIDADE.has(normalizedPrioridade)) {
      return NextResponse.json({ error: 'Prioridade invalida' }, { status: 400 })
    }

    const parsedDataVencimento = parseOptionalDate(dataVencimento)
    if (dataVencimento && !parsedDataVencimento) {
      return NextResponse.json(
        { error: 'Data de vencimento invalida' },
        { status: 400 }
      )
    }

    const normalizedClienteId =
      typeof clienteId === 'string' && clienteId.trim() !== '' ? clienteId.trim() : null
    if (normalizedClienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: { id: normalizedClienteId, userId },
        select: { id: true },
      })
      if (!cliente) {
        return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
      }
    }

    const normalizedOportunidadeId =
      typeof oportunidadeId === 'string' && oportunidadeId.trim() !== ''
        ? oportunidadeId.trim()
        : null
    if (normalizedOportunidadeId) {
      const oportunidade = await prisma.oportunidade.findFirst({
        where: { id: normalizedOportunidadeId, userId },
        select: { id: true },
      })
      if (!oportunidade) {
        return NextResponse.json(
          { error: 'Orçamento não encontrado' },
          { status: 404 }
        )
      }
    }

    const novaTarefa = await prisma.tarefa.create({
      data: {
        userId,
        titulo: titulo.trim(),
        descricao:
          typeof descricao === 'string' && descricao.trim() !== ''
            ? descricao.trim()
            : null,
        status: normalizedStatus,
        prioridade: normalizedPrioridade,
        dataVencimento: parsedDataVencimento ?? null,
        clienteId: normalizedClienteId,
        oportunidadeId: normalizedOportunidadeId,
        notificar: typeof notificar === 'boolean' ? notificar : false,
      },
    })

    return NextResponse.json(novaTarefa, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar tarefa:', error)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cliente ou orçamento não encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    )
  }
}
