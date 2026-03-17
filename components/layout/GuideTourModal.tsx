'use client'

import { Fragment, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, X } from '@/lib/icons'
import { menuItems } from '@/lib/menuItems'
import { useGuideTour } from './GuideTourProvider'
import { readUxFlagsCookie } from '@/lib/cookies'

const GUIDE_ITEMS = menuItems.filter((item) => item.helpDescription || item.guideSteps?.length)
const GUIDE_COLOR_THEMES = [
  {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
    bullet: 'bg-amber-500 dark:bg-amber-300',
    container:
      'border-amber-200/80 ring-amber-300/35 dark:border-amber-400/25 dark:ring-amber-300/15',
    header:
      'from-amber-50 via-white to-orange-50 dark:from-amber-500/10 dark:via-slate-900 dark:to-orange-500/10',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200',
    listBox: 'border-amber-200/70 bg-amber-50/70 dark:border-amber-400/25 dark:bg-amber-500/10',
    nextButton:
      'bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-300 dark:hover:bg-amber-200',
    progress: 'bg-amber-500 dark:bg-amber-300',
  },
  {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    bullet: 'bg-sky-500 dark:bg-sky-300',
    container: 'border-sky-200/80 ring-sky-300/35 dark:border-sky-400/25 dark:ring-sky-300/15',
    header:
      'from-sky-50 via-white to-cyan-50 dark:from-sky-500/10 dark:via-slate-900 dark:to-cyan-500/10',
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200',
    listBox: 'border-sky-200/70 bg-sky-50/70 dark:border-sky-400/25 dark:bg-sky-500/10',
    nextButton:
      'bg-sky-500 text-white hover:bg-sky-400 dark:bg-sky-300 dark:text-slate-950 dark:hover:bg-sky-200',
    progress: 'bg-sky-500 dark:bg-sky-300',
  },
  {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
    bullet: 'bg-emerald-500 dark:bg-emerald-300',
    container:
      'border-emerald-200/80 ring-emerald-300/35 dark:border-emerald-400/25 dark:ring-emerald-300/15',
    header:
      'from-emerald-50 via-white to-teal-50 dark:from-emerald-500/10 dark:via-slate-900 dark:to-teal-500/10',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
    listBox:
      'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-400/25 dark:bg-emerald-500/10',
    nextButton:
      'bg-emerald-500 text-white hover:bg-emerald-400 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200',
    progress: 'bg-emerald-500 dark:bg-emerald-300',
  },
  {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
    bullet: 'bg-rose-500 dark:bg-rose-300',
    container: 'border-rose-200/80 ring-rose-300/35 dark:border-rose-400/25 dark:ring-rose-300/15',
    header:
      'from-rose-50 via-white to-pink-50 dark:from-rose-500/10 dark:via-slate-900 dark:to-pink-500/10',
    icon: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
    listBox: 'border-rose-200/70 bg-rose-50/70 dark:border-rose-400/25 dark:bg-rose-500/10',
    nextButton:
      'bg-rose-500 text-white hover:bg-rose-400 dark:bg-rose-300 dark:text-slate-950 dark:hover:bg-rose-200',
    progress: 'bg-rose-500 dark:bg-rose-300',
  },
]

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
  const {
    guideActive,
    currentStep,
    currentGuideStep,
    currentItem,
    steps,
    openGuide,
    closeGuide,
    goNext,
    goPrev,
  } =
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

  const currentIndex = Math.max(0, Math.min(currentStep, Math.max(steps.length - 1, 0)))
  const colorTheme = GUIDE_COLOR_THEMES[currentIndex % GUIDE_COLOR_THEMES.length]

  if (!guideActive || steps.length === 0 || !currentItem || !currentGuideStep) {
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
    <div className="fixed inset-x-0 bottom-4 z-[10020] flex justify-center px-4 sm:bottom-5 sm:justify-end">
      <div
        className={`w-full max-w-xl overflow-hidden rounded-[32px] border bg-white/96 shadow-[0_28px_90px_-28px_rgba(15,23,42,0.55)] ring-4 backdrop-blur dark:bg-slate-900/96 ${colorTheme.container}`}
      >
        <div className={`bg-linear-to-r px-6 py-4 ${colorTheme.header}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${colorTheme.icon}`}
              >
                <currentItem.icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${colorTheme.badge}`}
                  >
                    Apresentação guiada
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
                  <div className={`rounded-2xl border p-4 ${colorTheme.listBox}`}>
                    <ul className="space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${colorTheme.bullet}`} />
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
                    ? `w-10 ${colorTheme.progress}`
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
              className={`inline-flex items-center gap-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${colorTheme.nextButton}`}
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
