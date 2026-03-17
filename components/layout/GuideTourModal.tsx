'use client'

import { Fragment, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, X } from '@/lib/icons'
import { menuItems } from '@/lib/menuItems'
import { useGuideTour } from './GuideTourProvider'
import { readUxFlagsCookie } from '@/lib/cookies'

const GUIDE_ITEMS = menuItems.filter((item) => item.helpDescription || item.guideSteps?.length)

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
  const { guideActive, currentGuideStep, currentItem, steps, openGuide, closeGuide, goNext, goPrev } =
    useGuideTour()

  useEffect(() => {
    const handler = () => {
      if (readUxFlagsCookie()?.guideSeen) return
      const visibleItems = getVisibleItems(session)
      if (visibleItems.length > 0) openGuide(visibleItems)
    }

    window.addEventListener('arker:show-guide', handler)
    return () => window.removeEventListener('arker:show-guide', handler)
  }, [openGuide, session])

  useEffect(() => {
    if (!guideActive || !currentGuideStep || pathname === currentGuideStep.href) return
    router.push(currentGuideStep.href)
  }, [currentGuideStep, guideActive, pathname, router])

  const currentIndex = currentGuideStep
    ? steps.findIndex((step) => step.id === currentGuideStep.id)
    : -1

  if (!guideActive || steps.length === 0 || !currentItem || !currentGuideStep || currentIndex < 0) {
    return null
  }

  const contentBlocks = currentGuideStep.description
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const bulletLines = lines.filter((line) => line.startsWith('- '))

      if (bulletLines.length === lines.length) {
        return {
          items: bulletLines.map((line) => line.replace(/^- /, '').trim()),
          type: 'list' as const,
        }
      }

      return {
        text: block,
        type: 'paragraph' as const,
      }
    })

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-5 sm:justify-end">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-amber-200/80 bg-white/96 shadow-[0_28px_90px_-28px_rgba(15,23,42,0.55)] ring-4 ring-amber-300/35 backdrop-blur dark:border-amber-400/25 dark:bg-slate-900/96 dark:ring-amber-300/15">
        <div className="bg-linear-to-r from-amber-50 via-white to-indigo-50 px-6 py-4 dark:from-amber-500/10 dark:via-slate-900 dark:to-indigo-500/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-400/15 dark:text-amber-200">
                <currentItem.icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                    Apresentação guiada
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-white dark:text-slate-900">
                    Foco nesta caixa
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {currentGuideStep.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Etapa {currentIndex + 1} de {steps.length}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeGuide}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Fechar apresentação"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-3 pt-5 text-[15px] leading-7 text-slate-700 dark:text-slate-200">
          <div className="space-y-4">
            {contentBlocks.map((block, index) => (
              <Fragment key={`${currentGuideStep.id}:${index}`}>
                {block.type === 'paragraph' ? (
                  <p>{block.text}</p>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                    <ul className="space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500 dark:bg-amber-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-6 py-4 dark:border-slate-700/80">
          <div className="mb-4 flex gap-1.5">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all ${
                  step.id === currentGuideStep.id
                    ? 'w-10 bg-amber-500 dark:bg-amber-300'
                    : 'w-2 bg-slate-300 dark:bg-slate-600'
                }`}
                aria-hidden="true"
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
              Etapa anterior
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 dark:bg-amber-300 dark:hover:bg-amber-200"
            >
              {currentIndex < steps.length - 1 ? (
                <>
                  Próxima etapa
                  <ChevronRight size={16} />
                </>
              ) : (
                'Finalizar apresentação'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
