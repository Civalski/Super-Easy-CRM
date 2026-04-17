import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api/route-helpers'
import { moneyRemaining, roundMoney, toNumber } from '@/lib/money'

export const dynamic = 'force-dynamic'
const ALLOWED_AMBIENTES = new Set(['geral', 'pessoal', 'total'])
const FLUXO_CACHE_TTL_MS = 20_000
const FLUXO_CACHE_MAX_ENTRIES = 500

type FluxoCacheEntry = {
  expiresAt: number
  payload: unknown
}

const fluxoCache = new Map<string, FluxoCacheEntry>()

function pruneFluxoCache(now: number) {
  fluxoCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) fluxoCache.delete(key)
  })

  if (fluxoCache.size <= FLUXO_CACHE_MAX_ENTRIES) return

  const overflow = fluxoCache.size - FLUXO_CACHE_MAX_ENTRIES
  let removed = 0

  for (const key of Array.from(fluxoCache.keys())) {
    fluxoCache.delete(key)
    removed += 1
    if (removed >= overflow) break
  }
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

type Bucket = {
  month: string
  recebido: number
  saida: number
  previstoReceber: number
  previstoPagar: number
  estornado: number
  vendasSemLancamento: number
}

async function buildFluxoForAmbiente(
  userId: string,
  ambiente: 'geral' | 'pessoal',
  from: Date,
  to: Date,
  months: number
): Promise<Map<string, Bucket>> {
  const [movimentos, previsoes, vendasFechadasSemLancamento] = await Promise.all([
    prisma.movimentoFinanceiro.findMany({
      where: {
        userId,
        contaReceber: { ambiente },
        dataMovimento: { gte: from, lte: to },
      },
      select: { dataMovimento: true, tipo: true, valor: true },
    }),
    prisma.contaReceber.findMany({
      where: {
        userId,
        ambiente,
        status: { in: ['pendente', 'parcial', 'atrasado'] },
        dataVencimento: { gte: from, lte: to },
      },
      select: { tipo: true, dataVencimento: true, valorTotal: true, valorRecebido: true },
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
          : { id: '__none__' },
      select: { updatedAt: true, valor: true },
    }),
  ])

  const map = new Map<string, Bucket>()
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
      bucket.estornado = roundMoney(bucket.estornado + toNumber(mov.valor))
    } else if (mov.tipo === 'saida') {
      bucket.saida = roundMoney(bucket.saida + toNumber(mov.valor))
    } else {
      bucket.recebido = roundMoney(bucket.recebido + toNumber(mov.valor))
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

  return map
}

function mergeMaps(m1: Map<string, Bucket>, m2: Map<string, Bucket>): Map<string, Bucket> {
  const merged = new Map<string, Bucket>()
  const allKeys = Array.from(new Set([...Array.from(m1.keys()), ...Array.from(m2.keys())]))
  for (const key of allKeys) {
    const b1 = m1.get(key) || { month: key, recebido: 0, saida: 0, previstoReceber: 0, previstoPagar: 0, estornado: 0, vendasSemLancamento: 0 }
    const b2 = m2.get(key) || { month: key, recebido: 0, saida: 0, previstoReceber: 0, previstoPagar: 0, estornado: 0, vendasSemLancamento: 0 }
    merged.set(key, {
      month: key,
      recebido: roundMoney(b1.recebido + b2.recebido),
      saida: roundMoney(b1.saida + b2.saida),
      previstoReceber: roundMoney(b1.previstoReceber + b2.previstoReceber),
      previstoPagar: roundMoney(b1.previstoPagar + b2.previstoPagar),
      estornado: roundMoney(b1.estornado + b2.estornado),
      vendasSemLancamento: roundMoney(b1.vendasSemLancamento + b2.vendasSemLancamento),
    })
  }
  return merged
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId) => {
    try {
      const { searchParams } = new URL(request.url)
      const months = Math.max(1, Math.min(24, Number(searchParams.get('months') || 6)))
      const ambienteParam = searchParams.get('ambiente')
      const ambiente = ambienteParam && ALLOWED_AMBIENTES.has(ambienteParam) ? ambienteParam : 'geral'

      const nowMs = Date.now()
      const cacheKey = `${userId}:${ambiente}:${months}`
      const cachedEntry = fluxoCache.get(cacheKey)
      if (cachedEntry && cachedEntry.expiresAt > nowMs) {
        return NextResponse.json(cachedEntry.payload)
      }

      if (fluxoCache.size > FLUXO_CACHE_MAX_ENTRIES) {
        pruneFluxoCache(nowMs)
      }

      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      let map: Map<string, Bucket>
      if (ambiente === 'total') {
        const [mapGeral, mapPessoal] = await Promise.all([
          buildFluxoForAmbiente(userId, 'geral', from, to, months),
          buildFluxoForAmbiente(userId, 'pessoal', from, to, months),
        ])
        map = mergeMaps(mapGeral, mapPessoal)
      } else {
        map = await buildFluxoForAmbiente(userId, ambiente as 'geral' | 'pessoal', from, to, months)
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

      const payload = {
        period: {
          from: from.toISOString(),
          to: to.toISOString(),
          months,
          ambiente,
        },
        totals,
        series,
      }

      fluxoCache.set(cacheKey, {
        payload,
        expiresAt: nowMs + FLUXO_CACHE_TTL_MS,
      })

      return NextResponse.json(payload)
    } catch (error) {
      console.error('Erro ao gerar fluxo de caixa:', error)
      return NextResponse.json({ error: 'Erro ao gerar fluxo de caixa' }, { status: 500 })
    }
  })
}
