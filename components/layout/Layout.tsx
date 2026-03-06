'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, MessageCircle, Mail, Instagram } from '@/lib/icons'
import Sidebar from './Sidebar'
import Header from './Header'
import SideCreateDrawer from '@/components/common/SideCreateDrawer'
import { ConfiguracoesContent } from '@/components/features/configuracoes'
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
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [supportDrawerOpen, setSupportDrawerOpen] = useState(false)
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
          className="flex min-w-0 flex-1 flex-col bg-linear-to-b from-slate-200 via-slate-200/98 to-slate-300/95 transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-slate-900/95 dark:via-slate-900/92 dark:to-slate-800/90 lg:pl-(--sidebar-width)"
        >
          <Header
            onMobileMenuClick={() => setMobileSidebarOpen((prev) => !prev)}
            onOpenConfig={() => setConfigDrawerOpen(true)}
            onOpenSupport={() => setSupportDrawerOpen(true)}
          />
          <main className="flex-1 overflow-auto px-4 pb-6 pt-[calc(var(--top-bar-height)+1rem)] md:px-6 md:pb-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>

      <SideCreateDrawer
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
        maxWidthClass="max-w-xl"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configurações</h2>
            <button
              type="button"
              onClick={() => setConfigDrawerOpen(false)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <ConfiguracoesContent />
          </div>
        </div>
      </SideCreateDrawer>

      <SideCreateDrawer
        open={supportDrawerOpen}
        onClose={() => setSupportDrawerOpen(false)}
        maxWidthClass="max-w-md"
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Suporte</h2>
            <button
              type="button"
              onClick={() => setSupportDrawerOpen(false)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Entre em contato por WhatsApp, Instagram ou e-mail para reportar problemas, sugestões ou dúvidas.
            </p>
            <div className="space-y-3">
              <a
                href="https://wa.me/5519998205608?text=Ol%C3%A1%2C%20gostaria%20de%20reportar%20um%20problema%2C%20sugest%C3%A3o%20ou%20d%C3%BAvida"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
              <a
                href="https://ig.me/m/arkersoft"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
              >
                <Instagram className="h-5 w-5 shrink-0 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-medium">Instagram (Direct)</span>
              </a>
              <a
                href="mailto:arkersoft@gmail.com"
                className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-gray-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/60"
              >
                <Mail className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium">arkersoft@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </SideCreateDrawer>
    </div>
  )
}
