export const LIST_DENSITY_STORAGE_KEY = 'arker:ui:list-density'
export const LIST_DENSITY_EVENT = 'arker:ui:list-density-change'

export type ListDensity = 'comfortable' | 'compact'

function normalizeDensity(value: string | null | undefined): ListDensity {
  return value === 'compact' ? 'compact' : 'comfortable'
}

export function getListDensityPreference(): ListDensity {
  if (typeof window === 'undefined') return 'comfortable'
  const stored = window.localStorage.getItem(LIST_DENSITY_STORAGE_KEY)
  return normalizeDensity(stored)
}

export function setListDensityPreference(density: ListDensity): void {
  if (typeof window === 'undefined') return
  const normalized = normalizeDensity(density)
  window.localStorage.setItem(LIST_DENSITY_STORAGE_KEY, normalized)
  window.dispatchEvent(new CustomEvent<ListDensity>(LIST_DENSITY_EVENT, { detail: normalized }))
}
