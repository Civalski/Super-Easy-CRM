import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { getUserSubscriptionAccess } from '@/lib/billing/subscription-access'
import { processFinanceAutomation } from '@/lib/financeiro/automation'
import { moneyRemaining, roundMoney } from '@/lib/money'

export const dynamic = 'force-dynamic'
const ALLOWED_AMBIENTES = new Set(['geral', 'pessoal'])

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const access = await getUserSubscriptionAccess(userId)
    if (!access.schemaReady) {
      return NextResponse.json(
        {
          error:
            'Banco sem colunas de assinatura. Rode a migracao do Prisma para habilitar o premium.',
          code: 'SUBSCRIPTION_SCHEMA_MISSING',
        },
        { status: 503 }
      )
    }
    if (!access.active) {
      return NextResponse.json(
        {
          error: 'Acesso ao modulo financeiro disponivel apenas para assinaturas premium ativas.',
          code: 'PREMIUM_REQUIRED',
          subscriptionStatus: access.status,
        },
        { status: 402 }
      )
    }

    const { searchParams } = new URL(request.url)
    const months = Math.max(1, Math.min(24, Number(searchParams.get('months') || 6)))
    const ambienteParam = searchParams.get('ambiente')
    const ambiente = ambienteParam && ALLOWED_AMBIENTES.has(ambienteParam) ? ambienteParam : 'geral'
    await processFinanceAutomation(userId, months)

    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [movimentos, previsoes, vendasFechadasSemLancamento] = await Promise.all([
      prisma.movimentoFinanceiro.findMany({
        where: {
          userId,
          contaReceber: {
            ambiente,
          },
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
          ambiente,
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
      prisma.oportunidade.findMany({
        where:
          ambiente === 'geral'
            ? {
                userId,
                status: 'fechada',
                updatedAt: { gte: from, lte: to },
                contasReceber: { none: {} },
              }
            : {
                id: '__none__',
              },
        select: {
          updatedAt: true,
          valor: true,
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
        vendasSemLancamento: number
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
        vendasSemLancamento: 0,
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

    for (const oportunidade of vendasFechadasSemLancamento) {
      const key = monthKey(oportunidade.updatedAt)
      const bucket = map.get(key)
      if (!bucket) continue
      const valorVenda = roundMoney(oportunidade.valor || 0)
      if (valorVenda <= 0) continue
      bucket.vendasSemLancamento = roundMoney(bucket.vendasSemLancamento + valorVenda)
      bucket.recebido = roundMoney(bucket.recebido + valorVenda)
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
        acc.vendasSemLancamento = roundMoney(acc.vendasSemLancamento + item.vendasSemLancamento)
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
        vendasSemLancamento: 0,
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
        ambiente,
      },
      totals,
      series,
    })
    } catch (error) {
      console.error('Erro ao gerar fluxo de caixa:', error)
      return NextResponse.json({ error: 'Erro ao gerar fluxo de caixa' }, { status: 500 })
    }
  })
}
