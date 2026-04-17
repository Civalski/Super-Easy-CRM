'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  menuItems,
  getMenuItemsForUser,
  filterMenuItemsByCrmEdition,
} from '@/lib/menuItems'
import { LogOut } from '@/lib/icons'
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus'
import { useGuideTour } from './GuideTourProvider'
import {
  MENU_MODULES_HIDDEN_EVENT,
  getHiddenMenuModules,
  resolveVisibleMenuModuleHrefs,
} from '@/lib/ui/menuModulesPreference'

export function HeaderNav() {
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
  const premiumAccess: 'loading' | 'active' | 'inactive' | 'error' =
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

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const getResolvedHref = (item: (typeof visibleMenuItems)[0]) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return '/configuracoes'
    }
    return item.href
  }

  const getResolvedTitle = (item: (typeof visibleMenuItems)[0]) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return `${item.name} (Premium - assine e use cupom ARKER25 para 25% vitalicio)`
    }
    return item.name
  }

  return (
    <nav
      className="hidden w-max min-w-0 items-center gap-0.5 lg:inline-flex"
      aria-label="Navegacao principal"
    >
      {visibleMenuItems.map((item) => {
        const ItemIcon = item.icon
        const isActive = isItemActive(item.href)
        const isLocked = item.requiresPremium && premiumAccess === 'inactive'
        const href = getResolvedHref(item)
        const title = getResolvedTitle(item)
        const isGuideHighlight = guideActive && currentItem?.href === item.href

        return (
          <Link
            key={item.href}
            href={href}
            title={title}
            aria-label={title}
            data-guide-href={item.href}
            onClick={(event) => {
              if (guideActive) {
                event.preventDefault()
              }
            }}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs font-medium leading-none transition-colors lg:px-2 lg:py-1.5 ${
              isActive
                ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                : isLocked
                  ? 'text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
            } ${isGuideHighlight ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-slate-900' : ''} ${
              guideActive ? 'cursor-not-allowed' : ''
            }`}
            aria-disabled={guideActive}
          >
            <ItemIcon
              size={14}
              className={`shrink-0 ${
                isActive
                  ? 'text-indigo-700 dark:text-indigo-200'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span className="max-w-[9.5rem] truncate sm:max-w-[11rem]">{item.name}</span>
            {isLocked ? (
              <span className="rounded bg-amber-100 px-0.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Pro
              </span>
            ) : null}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={() => signOut()}
        title="Sair"
        aria-label="Sair"
        className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs font-medium leading-none text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-500/14 dark:hover:text-red-100 lg:px-2 lg:py-1.5"
      >
        <LogOut size={14} className="shrink-0 text-slate-500 dark:text-slate-400" />
        <span>Sair</span>
      </button>
    </nav>
  )
}
