'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  X,
} from '@/lib/icons'
import { isBillingSubscriptionEnabledClient } from '@/lib/billing/feature-toggle'
import { menuItems } from '@/lib/menuItems'
import type { MenuItem } from '@/lib/menuItems'
import { useHelpMode } from './HelpModeProvider'
import { useGuideTour } from './GuideTourProvider'

interface SidebarProps {
  collapsed?: boolean
  isMobile?: boolean
  mobileOpen?: boolean
  onClose?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  showManualToggleButton?: boolean
  onManualToggleClick?: () => void
  manualOpen?: boolean
  /** Quando true, destaca o sidebar no modo ajuda */
  helpModeActive?: boolean
}

export default function Sidebar({
  collapsed = false,
  isMobile = false,
  mobileOpen = false,
  onClose,
  onMouseEnter,
  onMouseLeave,
  showManualToggleButton = false,
  onManualToggleClick,
  manualOpen = false,
  helpModeActive = false,
}: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const billingSubscriptionEnabled = isBillingSubscriptionEnabledClient()
  const { helpMode, showHelpFor } = useHelpMode()
  const { guideActive, currentItem } = useGuideTour()

  const username = (session?.user?.username ?? '').trim().toLowerCase()
  const role = session?.user?.role ?? ''
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.requiresAdmin && role !== 'admin') return false
    if (!item.visibleForUsernames) return true
    return item.visibleForUsernames.some((u) => u.trim().toLowerCase() === username)
  })
  const [premiumAccess, setPremiumAccess] = useState<'loading' | 'active' | 'inactive' | 'error'>(
    billingSubscriptionEnabled ? 'loading' : 'active'
  )

  const isCompact = collapsed && !isMobile
  const sidebarWidthClass = isCompact ? 'w-18' : isMobile ? 'w-72 max-w-[85vw]' : 'w-64'
  const topBarLayoutClass = isCompact ? 'justify-center' : isMobile ? 'justify-between' : 'justify-center'
  const mobileTransformClass = isMobile
    ? mobileOpen
      ? 'translate-x-0'
      : '-translate-x-full'
    : ''

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    if (!billingSubscriptionEnabled) return

    let cancelled = false

    async function loadPremiumAccess() {
      try {
        const response = await fetch('/api/billing/subscription', {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('Falha ao consultar assinatura')

        const payload = (await response.json()) as { active?: boolean }
        if (!cancelled) {
          setPremiumAccess(payload.active ? 'active' : 'inactive')
        }
      } catch {
        if (!cancelled) {
          setPremiumAccess('error')
        }
      }
    }

    void loadPremiumAccess()

    return () => {
      cancelled = true
    }
  }, [billingSubscriptionEnabled])

  const getResolvedHref = (item: MenuItem) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return '/configuracoes'
    }
    return item.href
  }

  const getResolvedTitle = (item: MenuItem) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return `${item.name} (Premium - assine para liberar)`
    }
    return item.name
  }

  return (
    <>
    <aside
      className={`fixed inset-y-0 left-0 z-50 ${sidebarWidthClass} ${mobileTransformClass} text-slate-800 transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-slate-100`}
      onMouseEnter={isMobile ? undefined : onMouseEnter}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
    >
      <div
        className={`flex h-full flex-col border-r border-slate-200/80 bg-linear-to-b from-slate-50/96 via-slate-50/92 to-white/96 backdrop-blur-xl shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] dark:border-slate-600/35 dark:from-slate-900/95 dark:via-slate-900/92 dark:to-slate-800/90 dark:shadow-[0_24px_55px_-35px_rgba(2,6,23,0.95)] transition-shadow duration-300 ${
          helpModeActive ? 'ring-[1.5px] ring-purple-500 ring-inset' : ''
        }`}
      >
        <div
          className={`flex min-h-(--top-bar-height) items-center border-b border-slate-200/80 px-4 dark:border-slate-600/30 ${topBarLayoutClass}`}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`group flex items-center justify-center ${isMobile ? '' : 'w-full'}`}
          >
            <div className="relative h-14 w-full overflow-hidden">
              <div
                className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCompact ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                }`}
              >
                <Image
                  src="/arkercrmlogoa.png"
                  alt="Arker CRM"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-2xl object-contain transition-opacity group-hover:opacity-90 dark:hidden"
                  priority
                />
                <Image
                  src="/arker-a.png"
                  alt="Arker CRM"
                  width={40}
                  height={40}
                  className="hidden h-10 w-10 rounded-2xl object-contain transition-opacity group-hover:opacity-90 dark:block"
                  priority
                />
              </div>

              <div
                className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCompact ? 'pointer-events-none scale-98 opacity-0' : 'scale-100 opacity-100'
                }`}
              >
                <Image
                  src="/arkercrmlogo.png?v=2"
                  alt="Arker CRM"
                  width={240}
                  height={88}
                  className="h-14 w-auto object-contain transition-opacity group-hover:opacity-90 dark:hidden"
                  priority
                />
                <Image
                  src="/arker10.png"
                  alt="Arker CRM"
                  width={156}
                  height={52}
                  className="hidden h-10 w-auto object-contain brightness-110 saturate-110 transition-opacity group-hover:opacity-90 dark:block"
                  priority
                />
              </div>
            </div>
          </Link>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-500/30 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
          <ul className="space-y-1.5">
            {visibleMenuItems.map((item) => {
              const ItemIcon = item.icon
              const isActive = isItemActive(item.href)
              const isLocked = item.requiresPremium && premiumAccess === 'inactive'
              const href = getResolvedHref(item)
              const title = getResolvedTitle(item)

              const handleItemClick = (e: React.MouseEvent) => {
                if (helpMode && item.helpDescription) {
                  e.preventDefault()
                  showHelpFor(item, e.currentTarget as HTMLElement)
                } else {
                  onClose?.()
                }
              }

              const isGuideHighlight = guideActive && currentItem?.href === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    title={title}
                    data-guide-href={item.href}
                    onClick={handleItemClick}
                    className={`group flex min-h-[44px] h-11 items-center rounded-xl px-0 transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                        : isLocked
                          ? 'text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
                    } ${helpMode && item.helpDescription ? 'cursor-help' : ''} ${isGuideHighlight ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                  >
                    <span className="inline-flex h-full w-12 shrink-0 items-center justify-center">
                      <ItemIcon
                        size={18}
                        className={`shrink-0 ${
                          isActive
                            ? 'text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-100'
                        }`}
                      />
                    </span>
                    <span
                      className={`min-w-0 overflow-hidden whitespace-nowrap pr-3 text-sm font-medium tracking-wide transition-[max-width,opacity,padding] duration-200 ease-out ${
                        isCompact ? 'max-w-0 pr-0 opacity-0' : 'max-w-36 pr-3 opacity-100'
                      }`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`overflow-hidden transition-[max-width,opacity,margin] duration-200 ease-out ${
                        isLocked && !isCompact ? 'ml-2 max-w-16 opacity-100' : 'ml-0 max-w-0 opacity-0'
                      }`}
                    >
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Premium
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-auto space-y-2 pt-2">
            {showManualToggleButton && !isMobile && onManualToggleClick && (
              <button
                type="button"
                onClick={onManualToggleClick}
                title={manualOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
                aria-label={manualOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
                className={`flex h-11 w-full items-center rounded-xl border border-slate-300/80 text-slate-700 transition-all duration-200 hover:border-slate-400/90 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-500/30 dark:text-slate-200 dark:hover:border-slate-300/40 dark:hover:bg-slate-700/35 dark:hover:text-white ${isCompact ? 'justify-center px-0' : 'justify-start px-3.5'}`}
              >
                {manualOpen ? <ChevronsLeft size={18} className="shrink-0" /> : <ChevronsRight size={18} className="shrink-0" />}
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity,transform,margin-left] duration-200 ease-out ${isCompact
                    ? 'ml-0 max-w-0 -translate-x-1 opacity-0'
                    : 'ml-3 max-w-36 translate-x-0 opacity-100'
                    }`}
                >
                  {manualOpen ? 'Fechar menu' : 'Abrir menu'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => signOut()}
              title="Sair"
              className="flex h-11 w-full items-center rounded-xl border border-slate-300/80 px-0 text-slate-700 transition-colors duration-200 hover:border-red-300/70 hover:bg-red-50 hover:text-red-700 dark:border-slate-500/30 dark:text-slate-200 dark:hover:border-red-300/30 dark:hover:bg-red-500/14 dark:hover:text-red-100"
            >
              <span className="inline-flex h-full w-12 shrink-0 items-center justify-center">
                <LogOut size={18} className="shrink-0" />
              </span>
              <span
                className={`min-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity,padding] duration-200 ease-out ${isCompact
                  ? 'max-w-0 pr-0 opacity-0'
                  : 'max-w-36 pr-3 opacity-100'
                  }`}
              >
                Sair
              </span>
            </button>
          </div>
        </nav>
      </div>
    </aside>

    {helpModeActive && (
      <div
        className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-0 animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ marginLeft: isMobile ? '18rem' : isCompact ? '4.5rem' : '16rem' }}
      >
        <span className="shrink-0 text-purple-500 dark:text-purple-400" aria-hidden>
          <ArrowLeft size={32} strokeWidth={2.5} />
        </span>
        <div className="rounded-xl border border-purple-200 bg-white px-5 py-3.5 shadow-lg dark:border-purple-800 dark:bg-slate-900">
          <span className="text-base font-medium text-slate-700 dark:text-slate-200">
            Selecione uma opção
          </span>
        </div>
      </div>
    )}
    </>
  )
}
