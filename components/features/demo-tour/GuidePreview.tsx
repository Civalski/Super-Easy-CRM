'use client'

import { DEMO_PREVIEWS } from './constants'
import type { DemoPreviewAction } from './types'
import { renderPreviewSection } from './GuidePreviewSections'

const actionClassMap: Record<NonNullable<DemoPreviewAction['tone']>, string> = {
  primary: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
  secondary: 'bg-blue-600 text-white dark:bg-blue-500',
  ghost: 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
}

const filterToneClassMap = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200',
} as const

export function GuidePreview({ href, active }: { href: string; active: boolean }) {
  const preview = DEMO_PREVIEWS[href] ?? DEMO_PREVIEWS['/dashboard']

  return (
    <div
      className={`pointer-events-none fixed inset-x-3 z-[52] transition-opacity duration-200 md:inset-x-6 lg:inset-x-8 ${active ? 'opacity-100' : 'opacity-0'}`}
      style={{ top: 'calc(var(--top-bar-height) + 4.25rem)', bottom: '7.25rem' }}
      aria-hidden={!active}
    >
      <div className="h-full overflow-hidden rounded-[32px] border border-slate-200/70 bg-linear-to-br from-white/92 via-slate-50/88 to-slate-100/85 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/70 dark:from-slate-900/88 dark:via-slate-900/82 dark:to-slate-800/82">
        <div className="flex items-center gap-2 border-b border-slate-200/70 px-5 py-3 dark:border-slate-700/70">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div className="ml-3 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800/85 dark:text-slate-300">
            Preview compartilhado do sistema
          </div>
        </div>

        <div className="h-[calc(100%-57px)] overflow-y-auto px-4 py-4 md:px-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Tela demonstrativa</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{preview.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{preview.subtitle}</p>
            </div>
            <div className="grid min-w-[280px] flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {preview.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/88">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {preview.toolbar ? (
            <div className="mb-4 rounded-3xl border border-slate-200/70 bg-white/85 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {preview.toolbar.searchPlaceholder ? (
                  <div className="min-w-[240px] flex-1 rounded-2xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-sm text-slate-400 dark:border-slate-700/70 dark:bg-slate-800/80 dark:text-slate-500">
                    {preview.toolbar.searchPlaceholder}
                  </div>
                ) : (
                  <div />
                )}
                {preview.toolbar.actions?.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {preview.toolbar.actions.map((action) => (
                      <span key={action.label} className={`rounded-2xl px-3 py-2 text-xs font-semibold ${actionClassMap[action.tone ?? 'ghost']}`}>
                        {action.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {preview.toolbar.filters?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.toolbar.filters.map((filter) => (
                    <span
                      key={filter.label}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        filter.active
                          ? filterToneClassMap[filter.tone ?? 'blue']
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {filter.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {preview.toolbar.tabs?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.toolbar.tabs.map((tab) => (
                    <span
                      key={tab.label}
                      className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
                        tab.active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count ? ` (${tab.count})` : ''}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            {preview.sections.map((section) => (
              <div key={section.title} className={section.span === 'full' ? 'xl:col-span-2' : ''}>
                {renderPreviewSection(section)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
