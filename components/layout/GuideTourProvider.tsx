'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { MenuItem } from '@/lib/menuItems'

interface GuideTourContextValue {
  guideActive: boolean
  currentStep: number
  currentItem: MenuItem | null
  items: MenuItem[]
  openGuide: (items: MenuItem[]) => void
  closeGuide: () => void
  setStep: (step: number) => void
  goNext: () => void
  goPrev: () => void
}

const GuideTourContext = createContext<GuideTourContextValue | null>(null)

export function GuideTourProvider({ children }: { children: React.ReactNode }) {
  const [guideActive, setGuideActive] = useState(false)
  const [items, setItems] = useState<MenuItem[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const currentItem = items[currentStep] ?? null

  const openGuide = useCallback((guideItems: MenuItem[]) => {
    setItems(guideItems)
    setCurrentStep(0)
    setGuideActive(true)
  }, [])

  const closeGuide = useCallback(() => {
    setGuideActive(false)
    setItems([])
    setCurrentStep(0)
  }, [])

  const setStep = useCallback((step: number) => {
    setCurrentStep((prev) => Math.max(0, Math.min(step, items.length - 1)))
  }, [items.length])

  const goNext = useCallback(() => {
    if (currentStep < items.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      closeGuide()
    }
  }, [currentStep, items.length, closeGuide])

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }, [])

  return (
    <GuideTourContext.Provider
      value={{
        guideActive,
        currentStep,
        currentItem,
        items,
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
