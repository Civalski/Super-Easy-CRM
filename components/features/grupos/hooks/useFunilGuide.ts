'use client'

import { useEffect, useMemo } from 'react'
import { useGuideTour } from '@/components/layout/GuideTourProvider'
import type { FunilTabValue } from '../constants'

interface UseFunilGuideParams {
  activeTab: FunilTabValue
  setActiveTab: (value: FunilTabValue) => void
  setPage: (value: number) => void
  viewMode: 'lista' | 'kanban'
  setViewMode: (value: 'lista' | 'kanban') => void
  onLockedInteraction?: () => void
}

export function useFunilGuide({
  activeTab,
  setActiveTab,
  setPage,
  viewMode,
  setViewMode,
  onLockedInteraction,
}: UseFunilGuideParams) {
  const { guideActive, currentGuideStep } = useGuideTour()

  const expectedTab = useMemo(() => {
    const value = currentGuideStep?.meta?.funilTab
    return value === 'sem_contato' ||
      value === 'contatado' ||
      value === 'em_potencial' ||
      value === 'aguardando_orcamento'
      ? value
      : null
  }, [currentGuideStep])

  const isFunilGuideActive = guideActive && currentGuideStep?.href === '/grupos'
  const tabsLocked = isFunilGuideActive && Boolean(expectedTab)
  const viewModeLocked = isFunilGuideActive

  useEffect(() => {
    if (!isFunilGuideActive) return

    if (viewMode !== 'lista') {
      setViewMode('lista')
    }

    if (expectedTab && activeTab !== expectedTab) {
      setActiveTab(expectedTab)
    }

    setPage(1)
  }, [activeTab, expectedTab, isFunilGuideActive, setActiveTab, setPage, setViewMode, viewMode])

  const handleTabChange = (nextTab: FunilTabValue) => {
    if (tabsLocked && expectedTab && nextTab !== expectedTab) {
      onLockedInteraction?.()
      return false
    }

    setActiveTab(nextTab)
    setPage(1)
    return true
  }

  const handleViewModeChange = (nextMode: 'lista' | 'kanban') => {
    if (viewModeLocked && nextMode !== 'lista') {
      onLockedInteraction?.()
      return false
    }

    setViewMode(nextMode)
    return true
  }

  return {
    currentFunilGuideTab: expectedTab,
    isFunilGuideActive,
    tabsLocked,
    viewModeLocked,
    handleTabChange,
    handleViewModeChange,
  }
}
