'use client'

import { useEffect, useState } from 'react'
import { setThemePreference, THEME_STORAGE_KEY } from '@/lib/ui/themePreference'
import { useOnboarding } from './hooks/useOnboarding'
import { OnboardingForm } from './OnboardingForm'
import type { OnboardingFormData } from './types'

const TOTAL_STEPS = 4

export function OnboardingContent() {
  const { status, loading, saving, error, submit, skip, shouldShow } = useOnboarding()
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isRefazer, setIsRefazer] = useState(false)

  useEffect(() => {
    const handleReset = (e: Event) => {
      const detail = (e as CustomEvent<{ refazer?: boolean }>).detail
      if (detail?.refazer) setIsRefazer(true)
    }
    window.addEventListener('arker:onboarding-reset', handleReset)
    return () => window.removeEventListener('arker:onboarding-reset', handleReset)
  }, [])

  useEffect(() => {
    if (!shouldShow) setIsRefazer(false)
  }, [shouldShow])

  // Aplica tema escuro desde o início do onboarding (antes do usuário chegar ao passo 4)
  // Só sobrescreve se o usuário ainda não tiver preferência salva (primeira vez)
  useEffect(() => {
    if (shouldShow && typeof window !== 'undefined' && !window.localStorage.getItem(THEME_STORAGE_KEY)) {
      setThemePreference('dark')
    }
  }, [shouldShow])

  // Animate entrance
  useEffect(() => {
    if (shouldShow) {
      const t = setTimeout(() => setVisible(true), 80)
      return () => clearTimeout(t)
    }
  }, [shouldShow])

  const handleSubmit = async (data: OnboardingFormData) => {
    const completed = await submit(data)
    if (!completed) return

    window.dispatchEvent(new CustomEvent('arker:onboarding-completed'))
    if (!isRefazer) {
      window.dispatchEvent(new CustomEvent('arker:show-guide'))
    }
  }

  const handleSkip = async () => {
    const completed = await skip()
    if (!completed) return

    window.dispatchEvent(new CustomEvent('arker:onboarding-completed'))
    if (!isRefazer) {
      window.dispatchEvent(new CustomEvent('arker:show-guide'))
    }
  }

  // When shouldShow transitions from true to false (success), animate close
  useEffect(() => {
    if (!shouldShow && visible && !closing) {
      setClosing(true)
      setTimeout(() => {
        setVisible(false)
        setClosing(false)
      }, 350)
    }
  }, [shouldShow, visible, closing])

  if (!shouldShow && !closing) return null

  const isPreviewStep = currentStep === TOTAL_STEPS

  const initialData = status
    ? {
        areaAtuacao: status.empresaConfig?.areaAtuacao ?? '',
        tipoPublico: (status.empresaConfig?.tipoPublico as 'B2B' | 'B2C' | 'ambos') ?? 'ambos',
        nomeEmpresa: status.pdfConfig?.nomeEmpresa ?? '',
        nomeVendedor: status.pdfConfig?.nomeVendedor ?? '',
        telefone: status.pdfConfig?.telefone ?? '',
        email: status.pdfConfig?.email ?? '',
        site: status.pdfConfig?.site ?? '',
        rodape: status.pdfConfig?.rodape ?? '',
        logoBase64: status.pdfConfig?.logoBase64 ?? '',
        logoPosicao: (status.pdfConfig?.logoPosicao as 'topo' | 'rodape') ?? 'topo',
        corPrimaria: status.pdfConfig?.corPrimaria ?? '#122d8c',
      }
    : undefined

  return (
    <div className={`onb-overlay ${visible && !closing ? 'onb-overlay--visible' : ''} ${closing ? 'onb-overlay--closing' : ''} ${isPreviewStep ? 'onb-overlay--preview-step' : ''}`}>
      <div className={`onb-modal ${visible && !closing ? 'onb-modal--visible' : ''} ${closing ? 'onb-modal--closing' : ''}`}>
        {/* Header branding */}
        <div className="onb-modal-header">
          <div className="onb-brand onb-brand--centered">
            <h1 className="onb-brand-title">
              {isRefazer ? 'Configurar novamente' : 'Bem-vindo ao Arker CRM'}
            </h1>
            <p className="onb-brand-subtitle">
              {isRefazer
                ? 'Atualize sua área de atuação, dados do PDF e preferências'
                : 'Vamos personalizar sua experiência em poucos passos'}
            </p>
          </div>
        </div>

        {/* Wizard body */}
        <div className="onb-modal-body">
          <OnboardingForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            saving={saving}
            error={error}
            onStepChange={setCurrentStep}
          />
        </div>
      </div>
    </div>
  )
}
