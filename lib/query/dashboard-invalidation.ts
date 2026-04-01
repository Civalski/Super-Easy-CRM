'use client'

import type { QueryClient } from '@tanstack/react-query'
import { dashboardQueryKeys } from './query-keys'

export type DashboardInvalidationSource =
  | 'tarefas'
  | 'oportunidades'
  | 'clientes'
  | 'metas'
  | 'financeiro'
  | 'all'

export async function invalidateDashboardQueries(
  queryClient: QueryClient,
  source: DashboardInvalidationSource
) {
  if (source === 'all') {
    await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
    return
  }

  const invalidations = {
    tarefas: [['dashboard', 'summary'], dashboardQueryKeys.atividadesRecentes()],
    oportunidades: [['dashboard', 'summary'], dashboardQueryKeys.atividadesRecentes()],
    clientes: [['dashboard', 'summary'], dashboardQueryKeys.atividadesRecentes()],
    metas: [['dashboard', 'metas'], ['dashboard', 'summary'], dashboardQueryKeys.atividadesRecentes()],
    financeiro: [['dashboard', 'fluxo-caixa'], ['dashboard', 'summary']],
  } as const

  for (const queryKey of invalidations[source]) {
    await queryClient.invalidateQueries({ queryKey })
  }
}
