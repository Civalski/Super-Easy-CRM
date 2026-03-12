'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, X } from '@/lib/icons'
import { menuItems } from '@/lib/menuItems'
import type { MenuItem } from '@/lib/menuItems'
import { useGuideTour } from './GuideTourProvider'

const GUIDE_ITEMS = menuItems.filter((item) => item.helpDescription)

function getVisibleItems(
  session: { user?: { username?: string | null; role?: string | null } } | null
): MenuItem[] {
  const username = (session?.user?.username ?? '').trim().toLowerCase()
  const role = session?.user?.role ?? ''
  return GUIDE_ITEMS.filter((item) => {
    if (item.requiresAdmin && role !== 'admin') return false
    if (!item.visibleForUsernames) return true
    return item.visibleForUsernames.some((u) => u.trim().toLowerCase() === username)
  })
}

function getPopoverPosition(anchorRect: DOMRect) {
  const gap = 12
  const popoverWidth = 400
  const popoverMaxHeight = 360
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768

  const isSidebarArea = anchorRect.left < 280
  const isHeaderArea = anchorRect.top < 100

  if (isSidebarArea) {
    const left = anchorRect.right + gap
    const top = Math.max(12, Math.min(anchorRect.top, viewportHeight - popoverMaxHeight - 12))
    return { left, top }
  }
  if (isHeaderArea) {
    const left = Math.max(12, Math.min(anchorRect.left + anchorRect.width / 2 - popoverWidth / 2, viewportWidth - popoverWidth - 12))
    const top = anchorRect.bottom + gap
    return { left, top }
  }
  const left = Math.max(12, Math.min(anchorRect.left, viewportWidth - popoverWidth - 12))
  const top = anchorRect.bottom + gap
  return { left, top }
}

export function GuideTourModal() {
  const { data: session } = useSession()
  const { guideActive, currentItem, items, openGuide, closeGuide, setStep, goNext, goPrev } = useGuideTour()
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const rafRef = useRef<number | null>(null)

  const updateRect = useCallback(() => {
    if (!currentItem) {
      setAnchorRect(null)
      return
    }
    const el = document.querySelector(`[data-guide-href="${currentItem.href}"]`) as HTMLElement | null
    if (el) {
      setAnchorRect(el.getBoundingClientRect())
    } else {
      setAnchorRect(null)
    }
  }, [currentItem?.href])

  useEffect(() => {
    const handler = () => {
      const visibleItems = getVisibleItems(session)
      if (visibleItems.length > 0) openGuide(visibleItems)
    }
    window.addEventListener('arker:show-guide', handler)
    return () => window.removeEventListener('arker:show-guide', handler)
  }, [session, openGuide])

  useLayoutEffect(() => {
    if (!guideActive || !currentItem) return

    const run = () => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(updateRect)
      })
    }

    run()
    const ro = new ResizeObserver(run)
    ro.observe(document.documentElement)
    window.addEventListener('scroll', run, { capture: true })
    window.addEventListener('resize', run)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('scroll', run, { capture: true })
      window.removeEventListener('resize', run)
    }
  }, [guideActive, currentItem?.href, updateRect])

  if (!guideActive || items.length === 0 || !currentItem) return null

  const popoverPos = anchorRect ? getPopoverPosition(anchorRect) : null

  return (
    <>
      {/* Spotlight: overlay com recorte na aba destacada */}
      {anchorRect && (
        <div
          className="fixed inset-0 z-[55] pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute transition-[top,left,width,height] duration-200"
            style={{
              top: anchorRect.top,
              left: anchorRect.left,
              width: anchorRect.width,
              height: anchorRect.height,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
              borderRadius: '12px',
            }}
          />
        </div>
      )}

      {/* Popover com descrição */}
      <div
        className="fixed z-[60] w-[min(400px,calc(100vw-24px))] max-h-[min(360px,70vh)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-600/50 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-200"
        style={
          popoverPos
            ? { left: popoverPos.left, top: popoverPos.top }
            : { left: '50%', top: 'calc(var(--top-bar-height) + 2rem)', transform: 'translateX(-50%)' }
        }
        role="dialog"
        aria-label="Guia das abas do CRM"
      >
        <div className="flex items-start justify-between gap-2 p-4 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <currentItem.icon size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{currentItem.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {items.indexOf(currentItem) + 1} de {items.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeGuide}
            className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[240px] overflow-y-auto px-4 pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {currentItem.helpDescription
            ?.split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex gap-1">
            {items.map((item, i) => (
              <button
                key={item.href}
                type="button"
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-colors ${
                  item.href === currentItem.href
                    ? 'w-6 bg-indigo-600 dark:bg-indigo-500'
                    : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                }`}
                aria-label={`Ir para aba ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={items.indexOf(currentItem) === 0}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors disabled:opacity-40 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {items.indexOf(currentItem) < items.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight size={16} />
                </>
              ) : (
                'Concluir'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
