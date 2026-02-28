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
  zIndexClass = 'z-[9999]',
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
        className="absolute inset-0 bg-slate-950/60"
      />

      <aside
        className={`absolute inset-y-0 right-0 h-dvh w-full ${maxWidthClass} min-w-0 overflow-hidden border-l border-purple-500/25 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-purple-900/30`}
      >
        {children}
      </aside>
    </div>,
    document.body
  )
}
