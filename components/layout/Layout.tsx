'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'

const SIDEBAR_COLLAPSED_WIDTH = '4.5rem'
const SIDEBAR_EXPANDED_WIDTH = '16rem'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  const layoutStyle = {
    '--sidebar-width': isSidebarHovered ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
  } as CSSProperties

  return (
    <div className="crm-shell">
      <div className="relative flex min-h-screen">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={!isSidebarHovered}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
          />
        </div>

        {/* Sidebar Mobile */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            ></div>
            <Sidebar
              isMobile
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div
          style={layoutStyle}
          className="flex min-w-0 flex-1 flex-col transition-[padding-left] duration-300 lg:pl-[var(--sidebar-width)]"
        >
          <Header
            onMobileMenuClick={() => setMobileSidebarOpen((prev) => !prev)}
          />
          <main className="flex-1 overflow-auto px-4 pb-6 pt-[calc(var(--top-bar-height)+1rem)] md:px-6 md:pb-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
