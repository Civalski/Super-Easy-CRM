'use client'

import type { ChangeEvent, ElementType } from 'react'

export const INPUT_CLASS = 'w-full rounded-lg border border-gray-300/80 bg-white/90 px-3 py-2 text-sm text-gray-900 shadow-xs transition focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white'
export const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[88px] resize-y`

interface ViewInfoBlockProps {
  icon: ElementType
  label: string
  value: string | null
}

export function ViewInfoBlock({ icon: Icon, label, value }: ViewInfoBlockProps) {
  return (
    <div className="rounded-lg border border-gray-200/70 bg-gray-50/80 p-2.5 dark:border-gray-700 dark:bg-gray-900/80">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-white">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">{value || '-'}</span>
      </p>
    </div>
  )
}

interface ViewGridItemProps {
  label: string
  value: string | null
}

export function ViewGridItem({ label, value }: ViewGridItemProps) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200/70 bg-gray-50/80 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/80">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  )
}

interface EditFieldProps {
  label: string
  name: string
  value: string
  type?: 'text' | 'email' | 'url' | 'date'
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function EditField({ label, name, value, onChange, type = 'text' }: EditFieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <input type={type} name={name} value={value} onChange={onChange} className={`${INPUT_CLASS} mt-1`} />
    </label>
  )
}
