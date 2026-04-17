'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  X,
} from '@/lib/icons'
import { getPostLoginPath } from '@/lib/crmEdition'
import {
  menuItems,
  getMenuItemsForUser,
  filterMenuItemsByCrmEdition,
} from '@/lib/menuItems'
import type { MenuItem } from '@/lib/menuItems'
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus'
import { useGuideTour } from './GuideTourProvider'
import {
  MENU_MODULES_HIDDEN_EVENT,
  getHiddenMenuModules,
  resolveVisibleMenuModuleHrefs,
} from '@/lib/ui/menuModulesPreference'

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
}: SidebarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const {
    billingEnabled: billingSubscriptionEnabled,
    active: hasActiveSubscription,
    error: subscriptionError,
    isLoading: subscriptionLoading,
  } = useSubscriptionStatus({
    enabled: status === 'authenticated',
  })
  const { guideActive, currentItem } = useGuideTour()

  const username = session?.user?.username
  const role = session?.user?.role
  const userStorageKey = session?.user?.id ?? session?.user?.email ?? username ?? null
  const [hiddenModules, setHiddenModules] = useState<string[]>([])

  useEffect(() => {
    const sync = () => {
      setHiddenModules(getHiddenMenuModules(userStorageKey))
    }

    const handleModulesChange = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>
      setHiddenModules(Array.isArray(customEvent.detail) ? customEvent.detail : [])
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(MENU_MODULES_HIDDEN_EVENT, handleModulesChange as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(MENU_MODULES_HIDDEN_EVENT, handleModulesChange as EventListener)
    }
  }, [userStorageKey])

  const allowedMenuItems = useMemo(
    () =>
      filterMenuItemsByCrmEdition(getMenuItemsForUser(menuItems, { role, username })),
    [role, username]
  )

  const visibleMenuItems = useMemo(() => {
    const visibleHrefs = new Set(
      resolveVisibleMenuModuleHrefs(
        allowedMenuItems.map((item) => item.href),
        hiddenModules
      )
    )

    return allowedMenuItems.filter((item) => visibleHrefs.has(item.href))
  }, [allowedMenuItems, hiddenModules])

  const isCompact = collapsed && !isMobile
  const sidebarWidthClass = isCompact ? 'w-18' : isMobile ? 'w-72 max-w-[85vw]' : 'w-64'
  const topBarLayoutClass = isCompact ? 'justify-center' : isMobile ? 'justify-between' : 'justify-center'
  const mobileTransformClass = isMobile
    ? mobileOpen
      ? 'translate-x-0'
      : '-translate-x-full'
    : ''

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const resolvedPremiumAccess: 'loading' | 'active' | 'inactive' | 'error' =
    !billingSubscriptionEnabled
      ? 'active'
      : status === 'loading'
        ? 'loading'
        : status !== 'authenticated'
          ? 'active'
          : subscriptionLoading
            ? 'loading'
            : subscriptionError
              ? 'error'
              : hasActiveSubscription
                ? 'active'
                : 'inactive'

  const getResolvedHref = (item: MenuItem) => {
    if (item.requiresPremium && resolvedPremiumAccess === 'inactive') {
      return '/configuracoes'
    }
    return item.href
  }

  const getResolvedTitle = (item: MenuItem) => {
    if (item.requiresPremium && resolvedPremiumAccess === 'inactive') {
      return `${item.name} (Premium - assine para liberar)`
    }
    return item.name
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 ${sidebarWidthClass} ${mobileTransformClass} text-slate-800 transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-slate-100`}
      onMouseEnter={isMobile ? undefined : onMouseEnter}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
    >
      <div className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-linear-to-b from-slate-50/96 via-slate-50/92 to-white/96 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-shadow duration-300 dark:border-slate-600/35 dark:from-slate-900/95 dark:via-slate-900/92 dark:to-slate-800/90 dark:shadow-[0_24px_55px_-35px_rgba(2,6,23,0.95)]">
        <div
          className={`flex min-h-(--top-bar-height) items-center border-b border-slate-200/80 px-4 dark:border-slate-600/30 ${topBarLayoutClass}`}
        >
          <Link
            href={getPostLoginPath()}
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

        <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain p-3">
          <ul className="space-y-1.5 pb-1">
            {visibleMenuItems.map((item) => {
              const ItemIcon = item.icon
              const isActive = isItemActive(item.href)
              const isLocked = item.requiresPremium && resolvedPremiumAccess === 'inactive'
              const href = getResolvedHref(item)
              const title = getResolvedTitle(item)
              const isGuideHighlight = guideActive && currentItem?.href === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    title={title}
                    data-guide-href={item.href}
                    onClick={(event) => {
                      if (guideActive) {
                        event.preventDefault()
                        return
                      }
                      onClose?.()
                    }}
                    className={`group flex h-11 min-h-[44px] items-center rounded-xl px-0 transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                        : isLocked
                          ? 'text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
                    } ${isGuideHighlight ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900' : ''} ${
                      guideActive ? 'cursor-not-allowed' : ''
                    }`}
                    aria-disabled={guideActive}
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
                {manualOpen ? (
                  <ChevronsLeft size={18} className="shrink-0" />
                ) : (
                  <ChevronsRight size={18} className="shrink-0" />
                )}
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity,transform,margin-left] duration-200 ease-out ${
                    isCompact
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
                className={`min-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity,padding] duration-200 ease-out ${
                  isCompact ? 'max-w-0 pr-0 opacity-0' : 'max-w-36 pr-3 opacity-100'
                }`}
              >
                Sair
              </span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
