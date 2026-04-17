const CENTS_FACTOR = 100

type MoneyLike = number | { toNumber(): number } | string | null | undefined

export function toNumber(value: MoneyLike): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber()
  return 0
}

export function roundMoney(value: MoneyLike): number {
  const n = toNumber(value)
  return Math.round((n + Number.EPSILON) * CENTS_FACTOR) / CENTS_FACTOR
}

export function moneyRemaining(total: MoneyLike, received: MoneyLike): number {
  return Math.max(0, roundMoney(roundMoney(total) - roundMoney(received)))
}

export function sumMoney(values: MoneyLike[]): number {
  let total = 0
  for (const value of values) {
    total = roundMoney(total + toNumber(value))
  }
  return total
}
