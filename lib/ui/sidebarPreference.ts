export const SIDEBAR_OPEN_MODE_STORAGE_KEY = 'arker:ui:sidebar-open-mode'
export const SIDEBAR_OPEN_MODE_EVENT = 'arker:ui:sidebar-open-mode-change'

export type SidebarOpenMode = 'auto' | 'button'

export function getSidebarOpenMode(): SidebarOpenMode {
  if (typeof window === 'undefined') return 'auto'

  const stored = window.localStorage.getItem(SIDEBAR_OPEN_MODE_STORAGE_KEY)
  return stored === 'button' ? 'button' : 'auto'
}

export function setSidebarOpenMode(mode: SidebarOpenMode): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(SIDEBAR_OPEN_MODE_STORAGE_KEY, mode)
  window.dispatchEvent(
    new CustomEvent<SidebarOpenMode>(SIDEBAR_OPEN_MODE_EVENT, { detail: mode })
  )
}
