'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RegisterFormValues } from '@/components/features/register/types'
import {
  clearRegisterDraft,
  loadRegisterDraft,
  saveRegisterDraft,
} from '@/components/features/register/storage'

type UseRegisterDraftParams = {
  enabled: boolean
  form: RegisterFormValues
  step: number
  onRestore: (draft: { form: RegisterFormValues; step: number }) => void
}

export function useRegisterDraft({
  enabled,
  form,
  step,
  onRestore,
}: UseRegisterDraftParams) {
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    const draft = loadRegisterDraft()
    if (
      draft?.form &&
      (draft.form.planId === 'plan_3' || draft.form.planId === 'plan_10')
    ) {
      setHasDraft(true)
    }
  }, [])

  const restoreDraft = useCallback(() => {
    const draft = loadRegisterDraft()
    if (!draft?.form) return

    onRestore(draft)
    setHasDraft(false)
  }, [onRestore])

  const discardDraft = useCallback(() => {
    clearRegisterDraft()
    setHasDraft(false)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const isPackage = form.planId === 'plan_3' || form.planId === 'plan_10'
    if (isPackage) {
      saveRegisterDraft(form, step)
      return
    }

    clearRegisterDraft()
  }, [enabled, form, step])

  return {
    clearDraft: clearRegisterDraft,
    discardDraft,
    hasDraft,
    restoreDraft,
  }
}
