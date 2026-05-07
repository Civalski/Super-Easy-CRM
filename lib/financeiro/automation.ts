import { prisma } from '@/lib/prisma'
import { moneyRemaining, roundMoney } from '@/lib/money'
import type { Prisma } from '@prisma/client'

export function deriveFinanceStatus(params: {
  status: string
  valorTotal: number
  valorRecebido: number
  dataVencimento: Date | null
}) {
  if (params.status === 'cancelado') return 'cancelado'
  const valorTotal = roundMoney(params.valorTotal)
  const valorRecebido = roundMoney(params.valorRecebido)
  const restante = moneyRemaining(valorTotal, valorRecebido)
  if (restante <= 0) return 'pago'
  if (valorRecebido > 0) return 'parcial'
  if (params.dataVencimento && params.dataVencimento.getTime() < Date.now()) return 'atrasado'
  return 'pendente'
}

export function addMonthsWithDay(baseDate: Date, monthsToAdd: number, targetDay: number) {
  const safeDay = Math.max(1, Math.min(31, targetDay))
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth() + monthsToAdd
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(safeDay, lastDay)
  const next = new Date(baseDate)
  next.setFullYear(year, month, day)
  return next
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Apos liquidar uma mensalidade, abre um unico novo vencimento (se a serie continuar ativa). */
export async function createNextRecurringMonthIfEligible(
  tx: Prisma.TransactionClient,
  userId: string,
  conta: {
    id: string
    recorrenteMensal: boolean
    recorrenciaAtiva: boolean
    status: string
    grupoParcelaId: string | null
    dataVencimento: Date | null
    valorTotal: number
    tipo: string
    autoDebito: boolean
    oportunidadeId: string | null
    ambiente: string
    descricao: string | null
    clienteId?: string | null
    fornecedorId?: string | null
    funcionarioId?: string | null
    recorrenciaDiaVencimento: number | null
    multaPorAtrasoPercentual?: number | null
    multaPorAtrasoValor?: number | null
    multaPorAtrasoPeriodo?: string | null
  },
) {
  if (!conta.recorrenteMensal || conta.status !== 'pago') return
  if (!conta.recorrenciaAtiva) return
  if (!conta.grupoParcelaId || !conta.dataVencimento) return

  const groupId = conta.grupoParcelaId
  const diaVenc = conta.recorrenciaDiaVencimento ?? conta.dataVencimento.getDate()
  const nextDate = addMonthsWithDay(conta.dataVencimento, 1, diaVenc)
  const nextKey = toDateKey(nextDate)

  const mesmoGrupo = await tx.contaReceber.findMany({
    where: { userId, grupoParcelaId: groupId, recorrenteMensal: true },
    select: { dataVencimento: true },
  })
  for (const row of mesmoGrupo) {
    if (row.dataVencimento && toDateKey(row.dataVencimento) === nextKey) {
      return
    }
  }

  const numeroMax = await tx.contaReceber
    .aggregate({
      where: { userId, grupoParcelaId: groupId, recorrenteMensal: true },
      _max: { numeroParcela: true },
    })
    .then((agg) => agg._max.numeroParcela ?? 0)

  const valorProx = roundMoney(conta.valorTotal)
  await tx.contaReceber.create({
    data: {
      userId,
      pedidoId: null,
      oportunidadeId: conta.oportunidadeId,
      clienteId: conta.clienteId ?? null,
      fornecedorId: conta.fornecedorId ?? null,
      funcionarioId: conta.funcionarioId ?? null,
      ambiente: conta.ambiente,
      tipo: conta.tipo,
      descricao: conta.descricao,
      valorTotal: valorProx,
      valorRecebido: 0,
      autoDebito: conta.autoDebito,
      grupoParcelaId: groupId,
      numeroParcela: numeroMax + 1,
      totalParcelas: null,
      dataVencimento: nextDate,
      status: deriveFinanceStatus({
        status: 'pendente',
        valorTotal: valorProx,
        valorRecebido: 0,
        dataVencimento: nextDate,
      }),
      recorrenteMensal: true,
      recorrenciaAtiva: true,
      recorrenciaDiaVencimento: diaVenc,
      ...(conta.multaPorAtrasoPercentual != null ? { multaPorAtrasoPercentual: conta.multaPorAtrasoPercentual } : {}),
      ...(conta.multaPorAtrasoValor != null ? { multaPorAtrasoValor: conta.multaPorAtrasoValor } : {}),
      ...(conta.multaPorAtrasoPeriodo != null ? { multaPorAtrasoPeriodo: conta.multaPorAtrasoPeriodo } : {}),
    },
  })
}

async function processAutoDebits(userId: string) {
  const dueAccounts = await prisma.contaReceber.findMany({
    where: {
      userId,
      tipo: 'pagar',
      autoDebito: true,
      status: { in: ['pendente', 'parcial', 'atrasado'] },
      dataVencimento: { lte: new Date() },
    },
    select: {
      id: true,
      valorTotal: true,
      valorRecebido: true,
    },
  })

  for (const conta of dueAccounts) {
    const restante = moneyRemaining(conta.valorTotal, conta.valorRecebido)
    if (restante <= 0) continue

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.contaReceber.updateMany({
        where: {
          id: conta.id,
          userId,
          tipo: 'pagar',
          autoDebito: true,
          status: { in: ['pendente', 'parcial', 'atrasado'] },
        },
        data: {
          valorRecebido: roundMoney(conta.valorTotal),
          status: 'pago',
        },
      })

      if (claimed.count === 0) {
        return
      }

      await tx.movimentoFinanceiro.create({
        data: {
          userId,
          contaReceberId: conta.id,
          tipo: 'saida',
          valor: restante,
          observacoes: 'Debito automatico de parcela no vencimento',
        },
      })

      const fullPaid = await tx.contaReceber.findFirst({
        where: { id: conta.id, userId },
      })
      if (fullPaid) {
        await createNextRecurringMonthIfEligible(tx, userId, fullPaid)
      }
    })
  }
}

/** Garante o proximo vencimento unico quando o ultimo lancamento do grupo esta pago e a serie segue ativa. */
async function ensureRecurringMonthlyAccounts(userId: string, _monthsAhead: number) {
  const recorrentes = await prisma.contaReceber.findMany({
    where: {
      userId,
      recorrenteMensal: true,
      grupoParcelaId: { not: null },
    },
    orderBy: [{ createdAt: 'asc' }],
  })

  if (recorrentes.length === 0) return

  const groups = new Map<string, typeof recorrentes>()
  for (const conta of recorrentes) {
    const groupId = conta.grupoParcelaId!
    const group = groups.get(groupId)
    if (group) {
      group.push(conta)
    } else {
      groups.set(groupId, [conta])
    }
  }

  for (const [, contas] of Array.from(groups.entries())) {
    const contasOrdenadas = [...contas].sort((a, b) => {
      const aDate = a.dataVencimento ? a.dataVencimento.getTime() : Number.NEGATIVE_INFINITY
      const bDate = b.dataVencimento ? b.dataVencimento.getTime() : Number.NEGATIVE_INFINITY
      if (aDate !== bDate) return aDate - bDate
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const last = contasOrdenadas[contasOrdenadas.length - 1]
    if (!last.dataVencimento || last.status !== 'pago' || !last.recorrenciaAtiva) continue

    await prisma.$transaction(async (tx) => {
      await createNextRecurringMonthIfEligible(tx, userId, last)
    })
  }
}

export async function processFinanceAutomation(userId: string, monthsAhead = 6) {
  const safeMonthsAhead = Math.max(1, Math.min(24, monthsAhead))
  await processAutoDebits(userId)
  await ensureRecurringMonthlyAccounts(userId, safeMonthsAhead)
}
