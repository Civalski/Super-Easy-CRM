'use client'

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  summary: (filter: 'day' | 'week' | 'month', dateIso: string) =>
    ['dashboard', 'summary', filter, dateIso] as const,
  metas: () => ['dashboard', 'metas'] as const,
  fluxoCaixa: (months: number) => ['dashboard', 'fluxo-caixa', months] as const,
  atividadesRecentes: () => ['dashboard', 'atividades-recentes'] as const,
}

