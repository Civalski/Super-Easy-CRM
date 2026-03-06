import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabaseInitialized } from '@/lib/prisma'
import { withAuth, zodErrorResponse } from '@/lib/api/route-helpers'
import { listTarefas, createTarefa } from '@/lib/services/tarefas'
import { tarefaCreateSchema, TAREFA_STATUS_SET, TAREFA_PRIORIDADE_SET } from '@/lib/validations/tarefas'
import { parseLimit, parsePage } from '@/lib/validations/common'

export const dynamic = 'force-dynamic'

function parseStatusFilter(value: string | null): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s !== '')
    )
  )
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const { searchParams } = new URL(request.url)
      const statusList = parseStatusFilter(searchParams.get('status'))
      const prioridade = searchParams.get('prioridade')?.trim().toLowerCase()

      if (statusList.some((s) => !TAREFA_STATUS_SET.has(s as 'pendente' | 'em_andamento' | 'concluida'))) {
        return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
      }

      if (prioridade && !TAREFA_PRIORIDADE_SET.has(prioridade as 'baixa' | 'media' | 'alta')) {
        return NextResponse.json({ error: 'Prioridade invalida' }, { status: 400 })
      }

      const result = await listTarefas(userId, {
        filters: {
          status: statusList.length > 0 ? statusList : undefined,
          prioridade: prioridade || undefined,
        },
        paginated: searchParams.get('paginated') === 'true',
        limit: parseLimit(searchParams.get('limit')),
        page: parsePage(searchParams.get('page')),
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      await ensureDatabaseInitialized()

      const rawBody = await request.json().catch(() => null)
      if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
        return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })
      }

      const parsed = tarefaCreateSchema.safeParse(rawBody)
      if (!parsed.success) {
        return zodErrorResponse(parsed.error)
      }

      const novaTarefa = await createTarefa(userId, parsed.data)
      return NextResponse.json(novaTarefa, { status: 201 })
    } catch (error: unknown) {
      console.error('Erro ao criar tarefa:', error)

      if (error instanceof Error) {
        if (error.message === 'CLIENTE_NAO_ENCONTRADO') {
          return NextResponse.json(
            { error: 'Cliente nao encontrado' },
            { status: 404 }
          )
        }
        if (error.message === 'ORCAMENTO_NAO_ENCONTRADO') {
          return NextResponse.json(
            { error: 'Orçamento não encontrado' },
            { status: 404 }
          )
        }
      }

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
  })
}
