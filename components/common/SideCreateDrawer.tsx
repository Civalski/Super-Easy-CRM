'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SideCreateDrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidthClass?: string
  zIndexClass?: string
}

export default function SideCreateDrawer({
  open,
  onClose,
  children,
  maxWidthClass = 'max-w-4xl',
  zIndexClass = 'z-9999',
}: SideCreateDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div className={`fixed left-0 top-0 h-dvh w-dvw ${zIndexClass}`}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px] dark:bg-slate-950/60"
      />

      <aside
        className={`absolute inset-y-0 right-0 h-dvh w-full ${maxWidthClass} min-w-0 overflow-hidden border-l border-slate-200/80 bg-linear-to-b from-white/95 via-slate-50/95 to-slate-100/92 text-slate-900 shadow-2xl shadow-slate-900/20 dark:border-slate-700/70 dark:from-slate-900/96 dark:via-slate-900/95 dark:to-slate-800/92 dark:text-slate-100 dark:shadow-slate-950/50`}
      >
        {children}
      </aside>
    </div>,
    document.body
  )
}
