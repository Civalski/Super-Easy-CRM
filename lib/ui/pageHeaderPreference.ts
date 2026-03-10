export const PAGE_HEADER_STORAGE_KEY = 'arker:ui:page-header-hide-decorations'
export const PAGE_HEADER_EVENT = 'arker:ui:page-header-change'

function normalizeBoolean(value: string | null | undefined): boolean {
  if (value === 'true') return true
  if (value === 'false') return false
  return false
}

/** Retorna true quando ícones e descrições devem ser ocultados nas páginas */
export function getHidePageHeaderDecorations(): boolean {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(PAGE_HEADER_STORAGE_KEY)
  return normalizeBoolean(stored)
}

export function setHidePageHeaderDecorations(hide: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PAGE_HEADER_STORAGE_KEY, String(hide))
  window.dispatchEvent(new CustomEvent<boolean>(PAGE_HEADER_EVENT, { detail: hide }))
}
