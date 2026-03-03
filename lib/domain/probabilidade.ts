export type ProbabilityLevel = 'baixa' | 'media' | 'alta'

const PROBABILITY_THRESHOLDS = {
  baixaMax: 33,
  mediaMax: 66,
}

const PROBABILITY_VALUE_BY_LEVEL: Record<ProbabilityLevel, number> = {
  baixa: 25,
  media: 50,
  alta: 75,
}

const PROBABILITY_LABEL_BY_LEVEL: Record<ProbabilityLevel, string> = {
  baixa: 'baixa',
  media: 'média',
  alta: 'alta',
}

const PROBABILITY_BADGE_CLASS_BY_LEVEL: Record<ProbabilityLevel, string> = {
  baixa: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  alta: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export function getProbabilityLevel(probability?: number | null): ProbabilityLevel {
  const safeValue = Number.isFinite(probability) ? Number(probability) : 0

  if (safeValue <= PROBABILITY_THRESHOLDS.baixaMax) return 'baixa'
  if (safeValue <= PROBABILITY_THRESHOLDS.mediaMax) return 'media'
  return 'alta'
}

export function getProbabilityLabel(probability?: number | null): string {
  return PROBABILITY_LABEL_BY_LEVEL[getProbabilityLevel(probability)]
}

export function getProbabilityValueFromLevel(level: ProbabilityLevel): number {
  return PROBABILITY_VALUE_BY_LEVEL[level]
}

export function getProbabilityBadgeClass(probability?: number | null): string {
  return PROBABILITY_BADGE_CLASS_BY_LEVEL[getProbabilityLevel(probability)]
}
