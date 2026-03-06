import { prisma } from '@/lib/prisma'
import type { TarefaCreateInput } from '@/lib/validations/tarefas'

export type ListTarefasFilters = {
  status?: string[]
  prioridade?: string
}

export async function listTarefas(
  userId: string,
  options: {
    filters?: ListTarefasFilters
    paginated?: boolean
    limit?: number
    page?: number
  } = {}
) {
  const { filters = {}, paginated, limit = 20, page = 1 } = options
  const statusList = filters.status ?? []
  const prioridade = filters.prioridade?.trim().toLowerCase()

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
    const take = Math.min(limit, 50)
    const skip = (page - 1) * take

    const [tarefas, total, pendentesCount, concluidasCount] = await Promise.all([
      prisma.tarefa.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.tarefa.count({ where }),
      prisma.tarefa.count({
        where: {
          userId,
          status: { in: ['pendente', 'em_andamento'] },
        },
      }),
      prisma.tarefa.count({
        where: { userId, status: 'concluida' },
      }),
    ])

    return {
      data: tarefas,
      meta: {
        total,
        page,
        limit: take,
        pages: Math.max(1, Math.ceil(total / take)),
      },
      counts: {
        pendentes: pendentesCount,
        concluidas: concluidasCount,
      },
    }
  }

  const take = Math.min(limit, 50)
  return prisma.tarefa.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function createTarefa(userId: string, data: TarefaCreateInput) {
  if (data.clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: data.clienteId, userId },
      select: { id: true },
    })
    if (!cliente) {
      throw new Error('CLIENTE_NAO_ENCONTRADO')
    }
  }

  if (data.oportunidadeId) {
    const oportunidade = await prisma.oportunidade.findFirst({
      where: { id: data.oportunidadeId, userId },
      select: { id: true },
    })
    if (!oportunidade) {
      throw new Error('ORCAMENTO_NAO_ENCONTRADO')
    }
  }

  return prisma.tarefa.create({
    data: {
      userId,
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      status: data.status,
      prioridade: data.prioridade,
      dataVencimento: data.dataVencimento ?? null,
      clienteId: data.clienteId,
      oportunidadeId: data.oportunidadeId,
      notificar: data.notificar,
    },
  })
}
