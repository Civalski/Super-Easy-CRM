import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const DEMO_DELETE_ORDER = [
  'MovimentoFinanceiro',
  'PedidoItem',
  'ContaReceber',
  'Pedido',
  'FollowUpAttempt',
  'Nota',
  'GoalSnapshot',
  'Goal',
  'Tarefa',
  'Oportunidade',
  'Contato',
  'ProspectoEnvioAgendado',
  'Prospecto',
  'MetaContatoDiaEsquecido',
  'MetaContatoConfig',
  'MotivoPerda',
  'ProdutoServico',
  'Fornecedor',
  'Funcionario',
  'Cliente',
] as const

type DemoTx = Prisma.TransactionClient

const DELETE_BY_MODEL: Record<(typeof DEMO_DELETE_ORDER)[number], (tx: DemoTx, userId: string, ids: string[]) => Promise<number>> = {
  MovimentoFinanceiro: async (tx, userId, ids) => (await tx.movimentoFinanceiro.deleteMany({ where: { userId, id: { in: ids } } })).count,
  PedidoItem: async (tx, userId, ids) => (await tx.pedidoItem.deleteMany({ where: { userId, id: { in: ids } } })).count,
  ContaReceber: async (tx, userId, ids) => (await tx.contaReceber.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Pedido: async (tx, userId, ids) => (await tx.pedido.deleteMany({ where: { userId, id: { in: ids } } })).count,
  FollowUpAttempt: async (tx, userId, ids) => (await tx.followUpAttempt.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Nota: async (tx, userId, ids) => (await tx.nota.deleteMany({ where: { userId, id: { in: ids } } })).count,
  GoalSnapshot: async (tx, _userId, ids) => (await tx.goalSnapshot.deleteMany({ where: { id: { in: ids } } })).count,
  Goal: async (tx, userId, ids) => (await tx.goal.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Tarefa: async (tx, userId, ids) => (await tx.tarefa.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Oportunidade: async (tx, userId, ids) => (await tx.oportunidade.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Contato: async (tx, userId, ids) => (await tx.contato.deleteMany({ where: { userId, id: { in: ids } } })).count,
  ProspectoEnvioAgendado: async (tx, userId, ids) => (await tx.prospectoEnvioAgendado.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Prospecto: async (tx, userId, ids) => (await tx.prospecto.deleteMany({ where: { userId, id: { in: ids } } })).count,
  MetaContatoDiaEsquecido: async (tx, _userId, ids) => (await tx.metaContatoDiaEsquecido.deleteMany({ where: { id: { in: ids } } })).count,
  MetaContatoConfig: async (tx, _userId, ids) => (await tx.metaContatoConfig.deleteMany({ where: { id: { in: ids } } })).count,
  MotivoPerda: async (tx, userId, ids) => (await tx.motivoPerda.deleteMany({ where: { userId, id: { in: ids } } })).count,
  ProdutoServico: async (tx, userId, ids) => (await tx.produtoServico.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Fornecedor: async (tx, userId, ids) => (await tx.fornecedor.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Funcionario: async (tx, userId, ids) => (await tx.funcionario.deleteMany({ where: { userId, id: { in: ids } } })).count,
  Cliente: async (tx, userId, ids) => (await tx.cliente.deleteMany({ where: { userId, id: { in: ids } } })).count,
}

export async function clearDemoDataForUser(userId: string) {
  return prisma.$transaction(async (tx) => {
    const records = await tx.demoDataRecord.findMany({
      where: { userId },
      select: { model: true, recordId: true },
    })

    const grouped = records.reduce<Record<string, string[]>>((acc, record) => {
      acc[record.model] ??= []
      acc[record.model].push(record.recordId)
      return acc
    }, {})

    const summary: Record<string, number> = {}

    for (const model of DEMO_DELETE_ORDER) {
      const ids = grouped[model] ?? []
      if (!ids.length) {
        summary[model] = 0
        continue
      }

      summary[model] = await DELETE_BY_MODEL[model](tx, userId, ids)
    }

    await tx.demoDataRecord.deleteMany({ where: { userId } })
    await tx.user.update({
      where: { id: userId },
      data: {
        demoModeActive: false,
        demoDataSeededAt: null,
      },
    })

    return summary
  })
}
