const CENTS_FACTOR = 100

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * CENTS_FACTOR) / CENTS_FACTOR
}

export function moneyRemaining(total: number, received: number): number {
  return Math.max(0, roundMoney(roundMoney(total) - roundMoney(received)))
}

export function sumMoney(values: number[]): number {
  let total = 0
  for (const value of values) {
    total = roundMoney(total + value)
  }
  return total
}
