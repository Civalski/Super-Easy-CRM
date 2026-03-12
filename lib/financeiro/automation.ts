import { prisma } from '@/lib/prisma'
import { moneyRemaining, roundMoney } from '@/lib/money'

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

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
    })
  }
}

async function ensureRecurringMonthlyAccounts(userId: string, monthsAhead: number) {
  const recurring = await prisma.contaReceber.findMany({
    where: {
      userId,
      recorrenteMensal: true,
      recorrenciaAtiva: true,
    },
    select: {
      id: true,
      userId: true,
      pedidoId: true,
      oportunidadeId: true,
      ambiente: true,
      tipo: true,
      descricao: true,
      valorTotal: true,
      autoDebito: true,
      grupoParcelaId: true,
      numeroParcela: true,
      dataVencimento: true,
      recorrenciaDiaVencimento: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }],
  })

  if (recurring.length === 0) return

  const groups = new Map<string, typeof recurring>()
  for (const conta of recurring) {
    const groupId = conta.grupoParcelaId || conta.id
    const group = groups.get(groupId)
    if (group) {
      group.push(conta)
    } else {
      groups.set(groupId, [conta])
    }
  }

  const now = new Date()
  const horizon = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 0, 23, 59, 59, 999)

  for (const [groupId, contas] of Array.from(groups.entries())) {
    const contasOrdenadas = [...contas].sort((a, b) => {
      const aDate = a.dataVencimento ? a.dataVencimento.getTime() : Number.NEGATIVE_INFINITY
      const bDate = b.dataVencimento ? b.dataVencimento.getTime() : Number.NEGATIVE_INFINITY
      if (aDate !== bDate) return aDate - bDate
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    const base = contasOrdenadas[0]
    const firstDue = base.dataVencimento || now
    const diaVencimento = base.recorrenciaDiaVencimento || firstDue.getDate()
    const existingDateKeys = new Set(
      contasOrdenadas
        .map((item) => item.dataVencimento)
        .filter((item): item is Date => Boolean(item))
        .map(toDateKey)
    )

    let latestDate =
      contasOrdenadas
        .map((item) => item.dataVencimento)
        .filter((item): item is Date => Boolean(item))
        .sort((a, b) => a.getTime() - b.getTime())
        .at(-1) || firstDue

    let nextParcela = Math.max(...contasOrdenadas.map((item) => item.numeroParcela || 0), 0) + 1
    const createData: Array<{
      userId: string
      pedidoId: string | null
      oportunidadeId: string | null
      ambiente: string
      tipo: string
      descricao: string | null
      valorTotal: number
      valorRecebido: number
      autoDebito: boolean
      grupoParcelaId: string
      numeroParcela: number
      totalParcelas: null
      dataVencimento: Date
      status: string
      recorrenteMensal: boolean
      recorrenciaAtiva: boolean
      recorrenciaDiaVencimento: number
    }> = []

    while (latestDate.getTime() < horizon.getTime()) {
      const nextDate = addMonthsWithDay(latestDate, 1, diaVencimento)
      latestDate = nextDate
      const key = toDateKey(nextDate)
      if (existingDateKeys.has(key)) continue

      existingDateKeys.add(key)
      createData.push({
        userId: base.userId,
        pedidoId: null,
        oportunidadeId: base.oportunidadeId,
        ambiente: base.ambiente,
        tipo: base.tipo,
        descricao: base.descricao,
        valorTotal: roundMoney(base.valorTotal),
        valorRecebido: 0,
        autoDebito: base.autoDebito,
        grupoParcelaId: groupId,
        numeroParcela: nextParcela,
        totalParcelas: null,
        dataVencimento: nextDate,
        status: deriveFinanceStatus({
          status: 'pendente',
          valorTotal: roundMoney(base.valorTotal),
          valorRecebido: 0,
          dataVencimento: nextDate,
        }),
        recorrenteMensal: true,
        recorrenciaAtiva: true,
        recorrenciaDiaVencimento: diaVencimento,
      })
      nextParcela += 1
    }

    if (createData.length > 0) {
      await prisma.contaReceber.createMany({
        data: createData,
        skipDuplicates: true,
      })
    }
  }
}

export async function processFinanceAutomation(userId: string, monthsAhead = 6) {
  const safeMonthsAhead = Math.max(1, Math.min(24, monthsAhead))
  await processAutoDebits(userId)
  await ensureRecurringMonthlyAccounts(userId, safeMonthsAhead)
}
