'use client'

import type { CSSProperties } from 'react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from '@/lib/icons'
import Sidebar from './Sidebar'
import Header from './Header'
import { HelpModeProvider, useHelpMode } from './HelpModeProvider'
import { HelpPopover } from './HelpPopover'
import { GuideTourModal } from './GuideTourModal'
import { GuideTourProvider, useGuideTour } from './GuideTourProvider'
import SideCreateDrawer from '@/components/common/SideCreateDrawer'
import { OnboardingGate } from './OnboardingGate'
import { SubscriptionGate } from './SubscriptionGate'
import { ConfiguracoesContent } from '@/components/features/configuracoes'
import {
  SIDEBAR_OPEN_MODE_EVENT,
  getSidebarOpenMode,
  type SidebarOpenMode,
} from '@/lib/ui/sidebarPreference'
import {
  MENU_LAYOUT_EVENT,
  getMenuLayout,
  type MenuLayoutType,
} from '@/lib/ui/menuLayoutPreference'

const SIDEBAR_COLLAPSED_WIDTH = '4.5rem'
const SIDEBAR_EXPANDED_WIDTH = '16rem'
const SIDEBAR_COLLAPSE_DELAY_MS = 120

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { helpMode, toggleHelpMode } = useHelpMode()
  const { guideActive } = useGuideTour()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isSidebarOpenedByButton, setIsSidebarOpenedByButton] = useState(false)
  const [sidebarOpenMode, setSidebarOpenMode] = useState<SidebarOpenMode>('auto')
  const [menuLayout, setMenuLayout] = useState<MenuLayoutType>('header')
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleOnboardingReset = () => setConfigDrawerOpen(false)
    window.addEventListener('arker:onboarding-reset', handleOnboardingReset)
    return () => window.removeEventListener('arker:onboarding-reset', handleOnboardingReset)
  }, [])

  useEffect(() => {
    if (helpMode || guideActive) {
      setMobileSidebarOpen(true)
      setIsSidebarHovered(true)
      setIsSidebarOpenedByButton(true)
    }
  }, [helpMode, guideActive])

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
    const syncMenuLayout = () => {
      setMenuLayout(getMenuLayout())
    }

    const handleMenuLayoutChange = (event: Event) => {
      const customEvent = event as CustomEvent<MenuLayoutType>
      setMenuLayout(customEvent.detail)
    }

    syncMenuLayout()
    window.addEventListener('storage', syncMenuLayout)
    window.addEventListener(MENU_LAYOUT_EVENT, handleMenuLayoutChange as EventListener)

    return () => {
      window.removeEventListener('storage', syncMenuLayout)
      window.removeEventListener(MENU_LAYOUT_EVENT, handleMenuLayoutChange as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!helpMode && !guideActive) {
      setIsSidebarHovered(false)
      setIsSidebarOpenedByButton(false)
    }
  }, [sidebarOpenMode, helpMode, guideActive])

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
      }
    }
  }, [])

  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding') {
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

  const useSidebarLayout = menuLayout === 'sidebar'
  const sidebarWidth =
    useSidebarLayout && isDesktopSidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : useSidebarLayout ? SIDEBAR_COLLAPSED_WIDTH : '0px'

  const layoutStyle = {
    '--sidebar-width': sidebarWidth,
  } as CSSProperties

  return (
    <div className="crm-shell" style={layoutStyle}>
        <div className="relative flex min-h-screen">
        {/* Overlay quando modo ajuda ativo */}
        {helpMode && (
          <div
            className="fixed inset-0 z-40 cursor-pointer bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 lg:left-[var(--sidebar-width)] lg:top-[var(--top-bar-height)]"
            aria-hidden
            onClick={() => {
              toggleHelpMode()
              setMobileSidebarOpen(false)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                toggleHelpMode()
                setMobileSidebarOpen(false)
              }
            }}
          />
        )}

        {/* Sidebar Desktop - oculto quando menu no header */}
        {useSidebarLayout && (
        <div className="hidden lg:block">
          <Sidebar
            collapsed={!isDesktopSidebarExpanded}
            onMouseEnter={sidebarOpenMode === 'auto' && !helpMode ? handleSidebarMouseEnter : undefined}
            onMouseLeave={sidebarOpenMode === 'auto' && !helpMode ? handleSidebarMouseLeave : undefined}
            showManualToggleButton={sidebarOpenMode === 'button'}
            onManualToggleClick={() => setIsSidebarOpenedByButton((prev) => !prev)}
            manualOpen={isSidebarOpenedByButton}
            helpModeActive={helpMode}
          />
        </div>
        )}

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
            onClick={() => !helpMode && setMobileSidebarOpen(false)}
          ></div>
          <Sidebar
            isMobile
            mobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            helpModeActive={helpMode}
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
            menuLayout={menuLayout}
          />
          <main className="flex-1 overflow-auto px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(var(--top-bar-height)+0.5rem)] md:px-6 md:pb-8 md:pt-[calc(var(--top-bar-height)+1rem)] lg:px-8">
            <Suspense fallback={<OnboardingGate>{children}</OnboardingGate>}>
              <SubscriptionGate>
                <OnboardingGate>{children}</OnboardingGate>
              </SubscriptionGate>
            </Suspense>
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
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <HelpModeProvider>
      <GuideTourProvider>
        <LayoutContent>{children}</LayoutContent>
        <HelpPopover />
        <GuideTourModal />
      </GuideTourProvider>
    </HelpModeProvider>
  )
}
