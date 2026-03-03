export const OPPORTUNITY_STATUSES = [
  'sem_contato',
  'em_potencial',
  'orcamento',
  'pedido',
  'fechada',
  'perdida',
] as const

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

const OPPORTUNITY_STATUS_LEGACY_MAP: Record<string, OpportunityStatus> = {
  prospeccao: 'sem_contato',
  qualificacao: 'em_potencial',
  proposta: 'orcamento',
  negociacao: 'orcamento',
}

export const OPEN_OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  'sem_contato',
  'em_potencial',
  'orcamento',
]

export function normalizeOpportunityStatus(
  value?: string | null
): OpportunityStatus | undefined {
  if (!value) return undefined
  const normalizedInput = value.trim().toLowerCase()
  const mapped = OPPORTUNITY_STATUS_LEGACY_MAP[normalizedInput] || normalizedInput

  return (OPPORTUNITY_STATUSES as readonly string[]).includes(mapped)
    ? (mapped as OpportunityStatus)
    : undefined
}

export function mapOpportunityStatusForResponse(status?: string | null) {
  if (!status) return status
  return normalizeOpportunityStatus(status) ?? status
}

export function expandOpportunityStatuses(statuses: OpportunityStatus[]) {
  const expanded = new Set<string>()

  for (const status of statuses) {
    expanded.add(status)

    if (status === 'sem_contato') {
      expanded.add('prospeccao')
      continue
    }
    if (status === 'em_potencial') {
      expanded.add('qualificacao')
      continue
    }
    if (status === 'orcamento') {
      expanded.add('proposta')
      expanded.add('negociacao')
    }
  }

  return Array.from(expanded)
}

export const PROSPECT_STATUSES = [
  'lead_frio',
  'novo',
  'em_contato',
  'qualificado',
  'descartado',
  'convertido',
] as const

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

export function normalizeProspectStatus(
  value?: string | null
): ProspectStatus | undefined {
  if (!value) return undefined
  const normalizedInput = value.trim().toLowerCase()

  return (PROSPECT_STATUSES as readonly string[]).includes(normalizedInput)
    ? (normalizedInput as ProspectStatus)
    : undefined
}
