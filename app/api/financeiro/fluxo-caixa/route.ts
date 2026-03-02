import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { processFinanceAutomation } from '@/lib/financeiro/automation'
import { moneyRemaining, roundMoney } from '@/lib/money'

export const dynamic = 'force-dynamic'

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = Math.max(1, Math.min(24, Number(searchParams.get('months') || 6)))
    await processFinanceAutomation(userId, months)

    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [movimentos, previsoes] = await Promise.all([
      prisma.movimentoFinanceiro.findMany({
        where: {
          userId,
          dataMovimento: { gte: from, lte: to },
        },
        select: {
          dataMovimento: true,
          tipo: true,
          valor: true,
        },
      }),
      prisma.contaReceber.findMany({
        where: {
          userId,
          status: { in: ['pendente', 'parcial', 'atrasado'] },
          dataVencimento: { gte: from, lte: to },
        },
        select: {
          tipo: true,
          dataVencimento: true,
          valorTotal: true,
          valorRecebido: true,
        },
      }),
    ])

    const map = new Map<
      string,
      {
        month: string
        recebido: number
        saida: number
        previstoReceber: number
        previstoPagar: number
        estornado: number
      }
    >()

    for (let i = 0; i < months; i++) {
      const date = new Date(from.getFullYear(), from.getMonth() + i, 1)
      const key = monthKey(date)
      map.set(key, {
        month: key,
        recebido: 0,
        saida: 0,
        previstoReceber: 0,
        previstoPagar: 0,
        estornado: 0,
      })
    }

    for (const mov of movimentos) {
      const key = monthKey(mov.dataMovimento)
      const bucket = map.get(key)
      if (!bucket) continue

      if (mov.tipo === 'estorno') {
        bucket.estornado = roundMoney(bucket.estornado + mov.valor)
      } else if (mov.tipo === 'saida') {
        bucket.saida = roundMoney(bucket.saida + mov.valor)
      } else {
        bucket.recebido = roundMoney(bucket.recebido + mov.valor)
      }
    }

    for (const conta of previsoes) {
      if (!conta.dataVencimento) continue
      const key = monthKey(conta.dataVencimento)
      const bucket = map.get(key)
      if (!bucket) continue

      const restante = moneyRemaining(conta.valorTotal, conta.valorRecebido)
      if (conta.tipo === 'pagar') {
        bucket.previstoPagar = roundMoney(bucket.previstoPagar + restante)
      } else {
        bucket.previstoReceber = roundMoney(bucket.previstoReceber + restante)
      }
    }

    const series = Array.from(map.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((item) => {
        const saldo = roundMoney(item.recebido - item.saida - item.estornado)
        const saldoProjetado = roundMoney(saldo + item.previstoReceber - item.previstoPagar)
        return {
          ...item,
          previsto: item.previstoReceber,
          saldo,
          saldoProjetado,
        }
      })

    const totals = series.reduce(
      (acc, item) => {
        acc.recebido = roundMoney(acc.recebido + item.recebido)
        acc.saida = roundMoney(acc.saida + item.saida)
        acc.previstoReceber = roundMoney(acc.previstoReceber + item.previstoReceber)
        acc.previstoPagar = roundMoney(acc.previstoPagar + item.previstoPagar)
        acc.estornado = roundMoney(acc.estornado + item.estornado)
        acc.saldo = roundMoney(acc.saldo + item.saldo)
        acc.saldoProjetado = roundMoney(acc.saldoProjetado + item.saldoProjetado)
        acc.previsto = roundMoney(acc.previsto + item.previsto)
        return acc
      },
      {
        recebido: 0,
        saida: 0,
        previstoReceber: 0,
        previstoPagar: 0,
        estornado: 0,
        saldo: 0,
        saldoProjetado: 0,
        previsto: 0,
      }
    )

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        months,
      },
      totals,
      series,
    })
  } catch (error) {
    console.error('Erro ao gerar fluxo de caixa:', error)
    return NextResponse.json({ error: 'Erro ao gerar fluxo de caixa' }, { status: 500 })
  }
}
