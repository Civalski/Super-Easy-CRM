export const CONFIRM_BEFORE_DELETE_STORAGE_KEY = 'arker:ui:confirm-before-delete'
export const CONFIRM_BEFORE_DELETE_EVENT = 'arker:ui:confirm-before-delete-change'

function normalizeBoolean(value: string | null | undefined): boolean {
  if (value === 'false') return false
  if (value === 'true') return true
  return true
}

export function getConfirmBeforeDeletePreference(): boolean {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(CONFIRM_BEFORE_DELETE_STORAGE_KEY)
  return normalizeBoolean(stored)
}

export function setConfirmBeforeDeletePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONFIRM_BEFORE_DELETE_STORAGE_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent<boolean>(CONFIRM_BEFORE_DELETE_EVENT, { detail: enabled }))
}
