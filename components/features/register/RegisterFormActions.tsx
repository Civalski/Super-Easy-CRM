'use client'

import { Button } from '@/components/common'
import { REGISTER_COPY } from '@/components/features/register/constants'
import { ArrowLeft, ArrowRight } from '@/lib/icons'

type RegisterFormActionsProps = {
  loading: boolean
  loadingLabel: string
  submitLabel: string
  isPackage: boolean
  isFirstStep: boolean
  isLastStep: boolean
  onNextStep: () => void
  onPrevStep: () => void
}

export function RegisterFormActions({
  loading,
  loadingLabel,
  submitLabel,
  isPackage,
  isFirstStep,
  isLastStep,
  onNextStep,
  onPrevStep,
}: RegisterFormActionsProps) {
  if (!isPackage) {
    return (
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full gap-2 rounded-xl text-sm font-semibold"
      >
        {loading ? loadingLabel : submitLabel}
        {!loading ? <ArrowRight size={16} /> : null}
      </Button>
    )
  }

  return (
    <div className="flex gap-3">
      {!isFirstStep ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onPrevStep}
          className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          {REGISTER_COPY.previous}
        </Button>
      ) : null}

      {!isLastStep ? (
        <Button
          type="button"
          onClick={onNextStep}
          className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold"
        >
          {REGISTER_COPY.next}
          <ArrowRight size={16} />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={loading}
          className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold"
        >
          {loading ? loadingLabel : submitLabel}
          {!loading ? <ArrowRight size={16} /> : null}
        </Button>
      )}
    </div>
  )
}
