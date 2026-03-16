'use client'

import type {
  DemoPreviewDefinition,
  DemoPreviewKanban,
  DemoPreviewList,
  DemoPreviewProgress,
  DemoPreviewTable,
  DemoPreviewTableCell,
  DemoPreviewTone,
} from './types'

const toneClassMap: Record<DemoPreviewTone, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200',
}

const progressBarClassMap: Record<DemoPreviewTone, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
}

function isObjectCell(cell: DemoPreviewTableCell): cell is Exclude<DemoPreviewTableCell, string> {
  return typeof cell !== 'string'
}

function renderTableCell(cell: DemoPreviewTableCell, index: number) {
  if (!isObjectCell(cell)) {
    return (
      <div key={index} className="truncate text-sm text-slate-700 dark:text-slate-200">
        {cell}
      </div>
    )
  }

  const align = cell.align === 'right' ? 'text-right justify-end' : 'text-left justify-start'
  const textClass =
    cell.emphasis === 'strong'
      ? 'font-semibold text-slate-900 dark:text-white'
      : cell.emphasis === 'muted'
        ? 'text-slate-500 dark:text-slate-400'
        : 'text-slate-700 dark:text-slate-200'

  return (
    <div key={index} className={`flex min-w-0 items-center ${align}`}>
      {cell.tone ? (
        <span className={`truncate rounded-full px-2 py-1 text-[11px] font-semibold ${toneClassMap[cell.tone]}`}>
          {cell.label}
        </span>
      ) : (
        <span className={`truncate text-sm ${textClass}`}>{cell.label}</span>
      )}
    </div>
  )
}

function renderTable(section: DemoPreviewTable) {
  const columns = `repeat(${section.columns.length}, minmax(0, 1fr))`

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/92 dark:border-slate-700/70 dark:bg-slate-900/86">
      <div className="border-b border-slate-200/70 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700/70 dark:text-slate-100">{section.title}</div>
      <div className="grid gap-3 border-b border-slate-200/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700/60 dark:text-slate-400" style={{ gridTemplateColumns: columns }}>
        {section.columns.map((column) => <span key={column} className="truncate">{column}</span>)}
      </div>
      <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
        {section.rows.map((row, index) => (
          <div key={`${section.title}-${index}`} className="grid gap-3 px-4 py-3" style={{ gridTemplateColumns: columns }}>
            {row.map((cell, cellIndex) => renderTableCell(cell, cellIndex))}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderList(section: DemoPreviewList) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/92 p-4 dark:border-slate-700/70 dark:bg-slate-900/86">
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
      <div className="space-y-3">
        {section.items.map((item) => (
          <div key={item.title} className="rounded-2xl bg-slate-50/90 px-3 py-3 dark:bg-slate-800/80">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
              </div>
              {item.badge ? <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClassMap[item.tone ?? 'slate']}`}>{item.badge}</span> : null}
            </div>
            {item.detail ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderProgress(section: DemoPreviewProgress) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/92 p-4 dark:border-slate-700/70 dark:bg-slate-900/86">
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
      <div className="space-y-4">
        {section.items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div className={`h-full rounded-full ${progressBarClassMap[item.tone ?? 'blue']}`} style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
            </div>
            {item.meta ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderKanban(section: DemoPreviewKanban) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/92 p-4 dark:border-slate-700/70 dark:bg-slate-900/86">
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{section.title}</h3>
      <div className="grid gap-3 xl:grid-cols-4">
        {section.columns.map((column) => (
          <div key={column.title} className="rounded-2xl bg-slate-50/95 p-3 dark:bg-slate-800/80">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.title}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-300">{column.cards.length}</span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200/70 bg-white px-3 py-3 dark:border-slate-700/70 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{card.title}</p>
                    {card.badge ? <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${toneClassMap[card.tone ?? 'slate']}`}>{card.badge}</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.meta}</p>
                  {card.detail ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.detail}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function renderPreviewSection(section: DemoPreviewDefinition['sections'][number]) {
  if (section.type === 'table') return renderTable(section)
  if (section.type === 'list') return renderList(section)
  if (section.type === 'progress') return renderProgress(section)
  return renderKanban(section)
}
