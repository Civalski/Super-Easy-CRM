'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { MenuItem } from '@/lib/menuItems'
import { writeUxFlagsCookie } from '@/lib/cookies'

export interface GuideTourStep {
  description: string
  href: string
  id: string
  item: MenuItem
  meta?: NonNullable<MenuItem['guideSteps']>[number]['meta']
  title: string
}

interface GuideTourContextValue {
  guideActive: boolean
  currentStep: number
  currentGuideStep: GuideTourStep | null
  currentItem: MenuItem | null
  steps: GuideTourStep[]
  openGuide: (items: MenuItem[]) => void
  closeGuide: () => void
  setStep: (step: number) => void
  goNext: () => void
  goPrev: () => void
}

const GuideTourContext = createContext<GuideTourContextValue | null>(null)

export function GuideTourProvider({ children }: { children: React.ReactNode }) {
  const [guideActive, setGuideActive] = useState(false)
  const [steps, setSteps] = useState<GuideTourStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const currentGuideStep = steps[currentStep] ?? null
  const currentItem = currentGuideStep?.item ?? null

  const buildSteps = useCallback((guideItems: MenuItem[]) => {
    return guideItems.flatMap((item, itemIndex) => {
      if (item.guideSteps && item.guideSteps.length > 0) {
        return item.guideSteps.map((step, stepIndex) => ({
          description: step.description,
          href: item.href,
          id: `${item.href}:${stepIndex}`,
          item,
          meta: step.meta,
          title: step.title ?? item.name,
        }))
      }

      if (!item.helpDescription) {
        return []
      }

      return [
        {
          description: item.helpDescription,
          href: item.href,
          id: `${item.href}:${itemIndex}`,
          item,
          title: item.name,
        },
      ]
    })
  }, [])

  const openGuide = useCallback((guideItems: MenuItem[]) => {
    setSteps(buildSteps(guideItems))
    setCurrentStep(0)
    setGuideActive(true)
  }, [buildSteps])

  const closeGuide = useCallback(() => {
    setGuideActive(false)
    setSteps([])
    setCurrentStep(0)
    writeUxFlagsCookie({ guideSeen: true })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arker:guide-finished'))
    }
  }, [])

  const setStep = useCallback((step: number) => {
    setCurrentStep((prev) => Math.max(0, Math.min(step, steps.length - 1)))
  }, [steps.length])

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      closeGuide()
    }
  }, [currentStep, steps.length, closeGuide])

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <GuideTourContext.Provider
      value={{
        guideActive,
        currentStep,
        currentGuideStep,
        currentItem,
        steps,
        openGuide,
        closeGuide,
        setStep,
        goNext,
        goPrev,
      }}
    >
      {children}
    </GuideTourContext.Provider>
  )
}

export function useGuideTour() {
  const ctx = useContext(GuideTourContext)
  if (!ctx) {
    throw new Error('useGuideTour must be used within GuideTourProvider')
  }
  return ctx
}
