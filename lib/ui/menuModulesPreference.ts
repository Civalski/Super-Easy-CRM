import { getCrmEdition } from '@/lib/crmEdition'

export const MENU_MODULES_HIDDEN_STORAGE_PREFIX = 'arker:ui:menu-modules:hidden'
export const MENU_MODULES_HIDDEN_EVENT = 'arker:ui:menu-modules-hidden-change'

/** Item de menu que não pode ser ocultado pelo usuário (home pós-login por edição). */
export function getRequiredMenuModuleHrefs(): readonly string[] {
  return getCrmEdition() === 'oss' ? ['/grupos'] : ['/dashboard']
}

function normalizeUserKey(userKey?: string | null): string {
  return (userKey ?? '').trim().toLowerCase()
}

function getStorageKey(userKey?: string | null): string {
  const normalizedUserKey = normalizeUserKey(userKey)
  return normalizedUserKey
    ? `${MENU_MODULES_HIDDEN_STORAGE_PREFIX}:${normalizedUserKey}`
    : MENU_MODULES_HIDDEN_STORAGE_PREFIX
}

function parseStoredArray(raw: string | null): string[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return Array.from(new Set(parsed.filter((value): value is string => typeof value === 'string')))
  } catch {
    return []
  }
}

export function getHiddenMenuModules(userKey?: string | null): string[] {
  if (typeof window === 'undefined') return []
  return parseStoredArray(window.localStorage.getItem(getStorageKey(userKey)))
}

export function setHiddenMenuModules(hiddenHrefs: string[], userKey?: string | null): void {
  if (typeof window === 'undefined') return

  const normalized = Array.from(new Set(hiddenHrefs.filter((value) => typeof value === 'string')))
  window.localStorage.setItem(getStorageKey(userKey), JSON.stringify(normalized))
  window.dispatchEvent(
    new CustomEvent<string[]>(MENU_MODULES_HIDDEN_EVENT, { detail: normalized })
  )
}

export function resolveVisibleMenuModuleHrefs(
  availableHrefs: string[],
  hiddenHrefs: string[]
): string[] {
  const hiddenSet = new Set(hiddenHrefs)
  const requiredSet = new Set(getRequiredMenuModuleHrefs())

  return availableHrefs.filter((href) => requiredSet.has(href) || !hiddenSet.has(href))
}
