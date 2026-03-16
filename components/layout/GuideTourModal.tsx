'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, X } from '@/lib/icons'
import { menuItems } from '@/lib/menuItems'
import { useGuideTour } from './GuideTourProvider'

const GUIDE_ITEMS = menuItems.filter((item) => item.helpDescription)

function getVisibleItems(
  session: { user?: { username?: string | null; role?: string | null } } | null
) {
  const username = (session?.user?.username ?? '').trim().toLowerCase()
  const role = session?.user?.role ?? ''

  return GUIDE_ITEMS.filter((item) => {
    if (item.requiresAdmin && role !== 'admin') return false
    if (item.requiresManager && role !== 'manager') return false
    if (!item.visibleForUsernames) return true
    return item.visibleForUsernames.some((value) => value.trim().toLowerCase() === username)
  })
}

export function GuideTourModal() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { guideActive, currentItem, items, openGuide, closeGuide, setStep, goNext, goPrev } = useGuideTour()

  useEffect(() => {
    const handler = () => {
      const visibleItems = getVisibleItems(session)
      if (visibleItems.length > 0) openGuide(visibleItems)
    }

    window.addEventListener('arker:show-guide', handler)
    return () => window.removeEventListener('arker:show-guide', handler)
  }, [openGuide, session])

  useEffect(() => {
    if (!guideActive || !currentItem || pathname === currentItem.href) return
    router.push(currentItem.href)
  }, [currentItem, guideActive, pathname, router])

  const currentIndex = useMemo(() => {
    if (!currentItem) return -1
    return items.findIndex((item) => item.href === currentItem.href)
  }, [currentItem, items])

  if (!guideActive || items.length === 0 || !currentItem || currentIndex < 0) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:justify-end">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-3 p-5 pb-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                <currentItem.icon size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                  Tour guiado real
                </p>
                <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                  {currentItem.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Etapa {currentIndex + 1} de {items.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeGuide}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Fechar tour"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pb-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <div className="space-y-3">
              {currentItem.helpDescription
                ?.split(/\n\s*\n/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>

          <div className="border-t border-slate-200/80 px-5 py-4 dark:border-slate-700/80">
            <div className="mb-4 flex gap-1.5">
              {items.map((item, index) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    item.href === currentItem.href
                      ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                  }`}
                  aria-label={`Ir para a etapa ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {currentIndex < items.length - 1 ? (
                  <>
                    Proximo
                    <ChevronRight size={16} />
                  </>
                ) : (
                  'Finalizar tour'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
