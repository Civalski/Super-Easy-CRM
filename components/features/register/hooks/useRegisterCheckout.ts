'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  INITIAL_REGISTER_FORM,
  REGISTER_COPY,
  REGISTER_PLANS,
} from '@/components/features/register/constants'
import type {
  RegisterFormField,
  RegisterFormValues,
  RegisterResponse,
} from '@/components/features/register/types'
import {
  isValidPassword,
  resolveTurnstileToken,
  toRegisterPayload,
  validateRegisterForm,
} from '@/components/features/register/utils'
import { useRegisterDraft } from '@/components/features/register/hooks/useRegisterDraft'
import { useRegisterTurnstile } from '@/components/features/register/hooks/useRegisterTurnstile'
import type { AppTheme } from '@/lib/ui/themePreference'

export function useRegisterCheckout(theme: AppTheme = 'dark') {
  const router = useRouter()
  const [form, setForm] = useState<RegisterFormValues>(INITIAL_REGISTER_FORM)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState<'idle' | 'registering' | 'redirecting'>(
    'idle'
  )
  const [stage, setStage] = useState<'plan' | 'register' | 'checkout'>('register')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const selectedPlan = REGISTER_PLANS.find((plan) => plan.id === form.planId)
  const totalSteps = selectedPlan?.licenses ?? 1
  const isPackage = totalSteps > 1
  const isLastStep = step === totalSteps - 1
  const isFirstStep = step === 0

  const setFieldError = useCallback((message: string) => {
    setError(message)
  }, [])

  const {
    renderTurnstile,
    resetTurnstile,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    turnstileToken,
  } = useRegisterTurnstile(setFieldError, theme)

  const { clearDraft, discardDraft, hasDraft, restoreDraft } = useRegisterDraft({
    enabled: stage === 'register',
    form,
    step,
    onRestore: (draft) => {
      setForm({ ...INITIAL_REGISTER_FORM, ...draft.form })
      setStep(draft.step)
      setStage('register')
      setClientSecret(null)
      setCheckoutOpen(false)
      setError('')
    },
  })

  const updateField = useCallback(
    (field: RegisterFormField, value: string | boolean) => {
      setForm((previous) => ({ ...previous, [field]: value }))
    },
    []
  )

  const updateTeamMember = useCallback(
    (
      index: number,
      field: keyof import('@/components/features/register/types').RegisterUserInput,
      value: string
    ) => {
      setForm((previous) => {
        const next = [...previous.teamMembers]
        if (!next[index]) return previous
        next[index] = { ...next[index], [field]: value }
        return { ...previous, teamMembers: next }
      })
    },
    []
  )

  const setPlanId = useCallback(
    (planId: import('@/components/features/register/types').RegisterPlanId) => {
      setForm((previous) => {
        const plan = REGISTER_PLANS.find((item) => item.id === planId)
        const licenses = plan?.licenses ?? 1
        const teamCount = Math.max(0, licenses - 1)
        const teamMembers = Array.from({ length: teamCount }, (_, index) =>
          previous.teamMembers[index] ?? {
            email: '',
            name: '',
            password: '',
            username: '',
          }
        )

        return {
          ...previous,
          planId,
          teamMembers,
          isManager: plan?.supportsManager ? previous.isManager : false,
        }
      })
      setStep(0)
    },
    []
  )

  const startRegisterFlow = useCallback(
    (planId: import('@/components/features/register/types').RegisterPlanId) => {
      setPlanId(planId)
      setClientSecret(null)
      setCheckoutOpen(false)
      setStage('register')
      setError('')
    },
    [setPlanId]
  )

  const backToPlanSelection = useCallback(() => {
    setClientSecret(null)
    setCheckoutOpen(false)
    setStage('plan')
    setStep(0)
    setError('')
  }, [])

  const openCheckout = useCallback(() => {
    if (!clientSecret) return
    setCheckoutOpen(true)
  }, [clientSecret])

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false)
  }, [])

  const validateCurrentStep = useCallback(() => {
    if (step === 0) {
      if (!form.name || !form.email || !form.phone || !form.username || !form.password) {
        return REGISTER_COPY.missingFields
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return REGISTER_COPY.invalidEmail
      if (form.phone.replace(/\D/g, '').length < 10) return REGISTER_COPY.invalidPhone
      if (form.password.length < 8) return REGISTER_COPY.passwordLength
      if (!isValidPassword(form.password)) return REGISTER_COPY.passwordComplexity
      if (form.password !== form.confirmPassword) return REGISTER_COPY.passwordMismatch
      return null
    }

    const member = form.teamMembers[step - 1]
    if (!member) return REGISTER_COPY.allAccountsRequired
    if (!member.name || !member.email || !member.username || !member.password) {
      return `${REGISTER_COPY.memberNumber} ${step + 1}: ${REGISTER_COPY.missingFields}`
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
      return `${REGISTER_COPY.memberNumber} ${step + 1}: ${REGISTER_COPY.invalidEmail}`
    }
    if (member.password.length < 8) {
      return `${REGISTER_COPY.memberNumber} ${step + 1}: ${REGISTER_COPY.passwordLength}`
    }
    if (!isValidPassword(member.password)) {
      return `${REGISTER_COPY.memberNumber} ${step + 1}: ${REGISTER_COPY.passwordComplexity}`
    }

    return null
  }, [form, step])

  const goToNextStep = useCallback(() => {
    const validationError = validateCurrentStep()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setStep((currentStep) => Math.min(currentStep + 1, totalSteps - 1))
  }, [totalSteps, validateCurrentStep])

  const goToPrevStep = useCallback(() => {
    setError('')
    setStep((currentStep) => Math.max(0, currentStep - 1))
  }, [])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError('')

      const validationError = validateRegisterForm(form)
      if (validationError) {
        setError(validationError)
        return
      }

      const resolvedTurnstileToken = resolveTurnstileToken(turnstileSiteKey, turnstileToken)
      if (turnstileSiteKey && !resolvedTurnstileToken) {
        setError(REGISTER_COPY.turnstileRequired)
        return
      }

      setLoadingStep('registering')

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toRegisterPayload(form, resolvedTurnstileToken)),
        })

        let data: RegisterResponse
        try {
          data = (await response.json()) as RegisterResponse
        } catch {
          setError(REGISTER_COPY.serverError)
          toast.error('Erro no cadastro', { description: REGISTER_COPY.serverError })
          resetTurnstile()
          setLoadingStep('idle')
          return
        }

        if (!response.ok || !data.success) {
          const errorMsg =
            data.error ||
            (typeof data.detail === 'string' ? data.detail : null) ||
            REGISTER_COPY.defaultError
          setError(errorMsg)
          toast.error('Erro no cadastro', { description: errorMsg })
          resetTurnstile()
          setLoadingStep('idle')
          return
        }

        clearDraft()

        const emailToConfirm = data.email ?? form.email
        if (data.requiresEmailConfirmation !== false && emailToConfirm) {
          setLoadingStep('redirecting')
          router.replace(`/register/check-email?email=${encodeURIComponent(emailToConfirm)}`)
          return
        }

        router.push('/login')
      } catch (err) {
        const isNetworkError =
          err instanceof TypeError &&
          (err.message === 'Failed to fetch' || err.message.includes('NetworkError'))

        const errorMsg = isNetworkError ? REGISTER_COPY.networkError : REGISTER_COPY.serverError
        setError(errorMsg)
        toast.error('Erro no cadastro', { description: errorMsg })
        resetTurnstile()
        setLoadingStep('idle')
      }
    },
    [clearDraft, form, resetTurnstile, router, turnstileSiteKey, turnstileToken]
  )

  const loading = loadingStep !== 'idle'
  const loadingLabel =
    loadingStep === 'redirecting'
      ? REGISTER_COPY.creatingCheckout
      : REGISTER_COPY.creatingAccount

  return {
    backToPlanSelection,
    checkoutOpen,
    closeCheckout,
    clientSecret,
    discardDraft,
    error,
    form,
    setFieldError,
    goToNextStep,
    goToPrevStep,
    handleSubmit,
    hasDraft,
    isFirstStep,
    isLastStep,
    isPackage,
    loading,
    loadingLabel,
    openCheckout,
    renderTurnstile,
    restoreDraft,
    setPlanId,
    stage,
    startRegisterFlow,
    step,
    totalSteps,
    turnstileContainerRef,
    turnstileReady,
    turnstileSiteKey,
    updateField,
    updateTeamMember,
  }
}
