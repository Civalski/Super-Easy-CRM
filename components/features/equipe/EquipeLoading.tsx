'use client'

export function EquipeLoading() {
  return (
    <div className="space-y-4">
      <div className="crm-card animate-pulse p-6">
        <div className="h-6 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="crm-card animate-pulse p-4">
            <div className="h-4 w-24 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="mt-3 h-8 w-20 rounded bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>

      <div className="crm-card animate-pulse p-6">
        <div className="h-4 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="mt-4 h-40 rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>
    </div>
  )
}
