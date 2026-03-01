'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import {
  SIDEBAR_OPEN_MODE_EVENT,
  getSidebarOpenMode,
  type SidebarOpenMode,
} from '@/lib/ui/sidebarPreference'

const SIDEBAR_COLLAPSED_WIDTH = '4.5rem'
const SIDEBAR_EXPANDED_WIDTH = '16rem'
const SIDEBAR_COLLAPSE_DELAY_MS = 120

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isSidebarOpenedByButton, setIsSidebarOpenedByButton] = useState(false)
  const [sidebarOpenMode, setSidebarOpenMode] = useState<SidebarOpenMode>('auto')
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const syncSidebarMode = () => {
      setSidebarOpenMode(getSidebarOpenMode())
    }

    const handleSidebarModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<SidebarOpenMode>
      setSidebarOpenMode(customEvent.detail)
    }

    syncSidebarMode()
    window.addEventListener('storage', syncSidebarMode)
    window.addEventListener(SIDEBAR_OPEN_MODE_EVENT, handleSidebarModeChange as EventListener)

    return () => {
      window.removeEventListener('storage', syncSidebarMode)
      window.removeEventListener(SIDEBAR_OPEN_MODE_EVENT, handleSidebarModeChange as EventListener)
    }
  }, [])

  useEffect(() => {
    setIsSidebarHovered(false)
    setIsSidebarOpenedByButton(false)
  }, [sidebarOpenMode])

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
      }
    }
  }, [])

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  const clearCollapseTimer = () => {
    if (!collapseTimerRef.current) return

    clearTimeout(collapseTimerRef.current)
    collapseTimerRef.current = null
  }

  const handleSidebarMouseEnter = () => {
    if (sidebarOpenMode !== 'auto') return
    clearCollapseTimer()
    setIsSidebarHovered(true)
  }

  const handleSidebarMouseLeave = () => {
    if (sidebarOpenMode !== 'auto') return
    clearCollapseTimer()
    collapseTimerRef.current = setTimeout(() => {
      setIsSidebarHovered(false)
      collapseTimerRef.current = null
    }, SIDEBAR_COLLAPSE_DELAY_MS)
  }

  const isDesktopSidebarExpanded =
    sidebarOpenMode === 'button' ? isSidebarOpenedByButton : isSidebarHovered

  const layoutStyle = {
    '--sidebar-width': isDesktopSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
  } as CSSProperties

  return (
    <div className="crm-shell">
      <div className="relative flex min-h-screen">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={!isDesktopSidebarExpanded}
            onMouseEnter={sidebarOpenMode === 'auto' ? handleSidebarMouseEnter : undefined}
            onMouseLeave={sidebarOpenMode === 'auto' ? handleSidebarMouseLeave : undefined}
            showManualToggleButton={sidebarOpenMode === 'button'}
            onManualToggleClick={() => setIsSidebarOpenedByButton((prev) => !prev)}
            manualOpen={isSidebarOpenedByButton}
          />
        </div>

        {/* Sidebar Mobile */}
        <div
          className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            mobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!mobileSidebarOpen}
        >
          <div
            className={`absolute inset-0 bg-slate-900/25 backdrop-blur-xs transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-slate-950/55 ${
              mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
          <Sidebar
            isMobile
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div
          style={layoutStyle}
          className="flex min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-(--sidebar-width)"
        >
          <Header onMobileMenuClick={() => setMobileSidebarOpen((prev) => !prev)} />
          <main className="flex-1 overflow-auto px-4 pb-6 pt-[calc(var(--top-bar-height)+1rem)] md:px-6 md:pb-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
