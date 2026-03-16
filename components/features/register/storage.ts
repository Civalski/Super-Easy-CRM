import type { RegisterFormValues } from '@/components/features/register/types'

const STORAGE_KEY = 'arker_register_draft'
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 horas

export interface StoredDraft {
  form: RegisterFormValues
  step: number
  savedAt: number
}

export function saveRegisterDraft(form: RegisterFormValues, step: number): void {
  if (typeof window === 'undefined') return
  try {
    const draft: StoredDraft = {
      form,
      step,
      savedAt: Date.now(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // localStorage pode estar cheio ou desabilitado
  }
}

export function loadRegisterDraft(): StoredDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as StoredDraft
    if (!draft.form || typeof draft.step !== 'number' || !draft.savedAt) return null
    if (Date.now() - draft.savedAt > EXPIRY_MS) {
      clearRegisterDraft()
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearRegisterDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
