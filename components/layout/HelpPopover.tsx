'use client'

import { useMemo } from 'react'
import { X } from '@/lib/icons'
import { useHelpMode } from './HelpModeProvider'

function getPosition(anchorRect: { top: number; left: number; right: number; bottom: number }) {
  if (typeof window === 'undefined') return { left: 12, top: 80 }
  const gap = 8
  const popoverWidth = 520
  const popoverMaxHeight = 560
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const anchorWidth = anchorRect.right - anchorRect.left

  const isHeaderArea = anchorRect.top < 120
  const isSidebarArea = anchorRect.left < 280

  if (isHeaderArea) {
    const left = Math.max(12, Math.min(anchorRect.left + anchorWidth / 2 - popoverWidth / 2, viewportWidth - popoverWidth - 12))
    const top = anchorRect.bottom + gap
    return { left, top }
  }
  if (isSidebarArea) {
    const left = anchorRect.right + gap
    const top = Math.max(12, Math.min(anchorRect.top, viewportHeight - popoverMaxHeight - 12))
    return { left, top }
  }
  const left = Math.max(12, Math.min(anchorRect.left, viewportWidth - popoverWidth - 12))
  const top = anchorRect.bottom + gap
  return { left, top }
}

export function HelpPopover() {
  const { selectedHelpItem, anchorRect, clearHelpSelection } = useHelpMode()

  const position = useMemo(() => {
    if (!anchorRect) return null
    return getPosition(anchorRect)
  }, [anchorRect])

  if (!selectedHelpItem?.helpDescription) return null

  const style = position
    ? { left: position.left, top: position.top }
    : { left: '50%', top: 'calc(var(--top-bar-height) + 0.5rem)', transform: 'translate(-50%, 0)' }

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={style}
      role="dialog"
      aria-label="Explicação do menu"
    >
      <div className="relative w-[min(520px,calc(100vw-24px))] max-h-[min(560px,88vh)] overflow-y-auto rounded-xl border border-slate-200/90 bg-white/95 px-6 py-5 pr-12 shadow-xl backdrop-blur-sm dark:border-slate-600/50 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={clearHelpSelection}
          className="absolute right-2 top-2 rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 pr-6">
          {selectedHelpItem.name}
        </p>
            <div className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {selectedHelpItem.helpDescription
                ?.split(/\n\s*\n/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((paragraph, i, arr) => (
                  <div key={i}>
                    <p className="mb-0">{paragraph}</p>
                    {i < arr.length - 1 && <div className="h-5 shrink-0" aria-hidden />}
                  </div>
                ))}
        </div>
      </div>
    </div>
  )
}
