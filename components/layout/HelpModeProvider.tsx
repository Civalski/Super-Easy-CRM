'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { MenuItem } from '@/lib/menuItems'

export interface HelpAnchorRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

interface HelpModeContextValue {
  helpMode: boolean
  toggleHelpMode: () => void
  selectedHelpItem: MenuItem | null
  anchorRect: HelpAnchorRect | null
  showHelpFor: (item: MenuItem, anchorElement?: HTMLElement) => void
  clearHelpSelection: () => void
}

const HelpModeContext = createContext<HelpModeContextValue | null>(null)

export function HelpModeProvider({ children }: { children: React.ReactNode }) {
  const [helpMode, setHelpMode] = useState(false)
  const [selectedHelpItem, setSelectedHelpItem] = useState<MenuItem | null>(null)
  const [anchorRect, setAnchorRect] = useState<HelpAnchorRect | null>(null)

  const toggleHelpMode = useCallback(() => {
    setHelpMode((prev) => !prev)
    setSelectedHelpItem(null)
    setAnchorRect(null)
  }, [])

  const showHelpFor = useCallback((item: MenuItem, anchorElement?: HTMLElement) => {
    setSelectedHelpItem(item)
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect()
      setAnchorRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      })
    } else {
      setAnchorRect(null)
    }
  }, [])

  const clearHelpSelection = useCallback(() => {
    setSelectedHelpItem(null)
    setAnchorRect(null)
  }, [])

  return (
    <HelpModeContext.Provider
      value={{
        helpMode,
        toggleHelpMode,
        selectedHelpItem,
        anchorRect,
        showHelpFor,
        clearHelpSelection,
      }}
    >
      {children}
    </HelpModeContext.Provider>
  )
}

export function useHelpMode() {
  const ctx = useContext(HelpModeContext)
  if (!ctx) {
    throw new Error('useHelpMode must be used within HelpModeProvider')
  }
  return ctx
}
