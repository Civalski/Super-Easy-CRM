'use client'

import { useEffect, useState } from 'react'
import { CreateContratoChoiceModal } from './CreateContratoChoiceModal'
import { CreateContratoIaModal } from './CreateContratoIaModal'
import { CreateContratoManualModal } from './CreateContratoManualModal'
import type { CreateContratoModalProps } from './types'

type CreateContratoStep = 'choice' | 'manual' | 'ia'

export function CreateContratoModal(props: CreateContratoModalProps) {
  const { open, onClose, initialMode = null } = props
  const [step, setStep] = useState<CreateContratoStep>('choice')
  const hasChoiceStep = !initialMode

  useEffect(() => {
    if (open) {
      setStep(initialMode ?? 'choice')
    }
  }, [initialMode, open])

  const handleClose = () => {
    setStep('choice')
    onClose()
  }

  return (
    <>
      {hasChoiceStep ? (
        <CreateContratoChoiceModal
          open={open && step === 'choice'}
          onClose={handleClose}
          onSelect={(mode) => setStep(mode)}
        />
      ) : null}

      <CreateContratoManualModal
        {...props}
        open={open && step === 'manual'}
        onClose={handleClose}
        onBack={hasChoiceStep ? () => setStep('choice') : handleClose}
      />

      <CreateContratoIaModal
        {...props}
        open={open && step === 'ia'}
        onClose={handleClose}
        onBack={hasChoiceStep ? () => setStep('choice') : handleClose}
      />
    </>
  )
}
