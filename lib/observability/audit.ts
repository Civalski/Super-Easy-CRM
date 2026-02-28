export type BusinessEventName =
  | 'oportunidade.status_changed'
  | 'pedido.venda_confirmada'
  | 'pedido.venda_reaberta'
  | 'prospecto.qualificado'
  | 'prospecto.promovido'
  | 'prospecto.convertido'

export function logBusinessEvent(input: {
  event: BusinessEventName
  userId: string
  entity: string
  entityId: string
  from?: string | null
  to?: string | null
  metadata?: Record<string, unknown>
}) {
  const payload = {
    ts: new Date().toISOString(),
    ...input,
  }

  // Structured log for low-cost observability of critical business actions.
  console.info('[audit]', JSON.stringify(payload))
}
