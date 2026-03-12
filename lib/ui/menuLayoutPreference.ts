export const MENU_LAYOUT_STORAGE_KEY = 'arker:ui:menu-layout'
export const MENU_LAYOUT_EVENT = 'arker:ui:menu-layout-change'

export type MenuLayoutType = 'sidebar' | 'header'

export function getMenuLayout(): MenuLayoutType {
  if (typeof window === 'undefined') return 'header'

  const stored = window.localStorage.getItem(MENU_LAYOUT_STORAGE_KEY)
  return stored === 'sidebar' ? 'sidebar' : 'header'
}

export function setMenuLayout(layout: MenuLayoutType): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(MENU_LAYOUT_STORAGE_KEY, layout)
  window.dispatchEvent(
    new CustomEvent<MenuLayoutType>(MENU_LAYOUT_EVENT, { detail: layout })
  )
}
