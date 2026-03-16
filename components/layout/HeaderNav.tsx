'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { menuItems } from '@/lib/menuItems'
import { LogOut } from '@/lib/icons'
import { useSubscriptionStatus } from '@/lib/hooks/useSubscriptionStatus'
import { useHelpMode } from './HelpModeProvider'
import { useGuideTour } from './GuideTourProvider'

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
  const { helpMode, showHelpFor } = useHelpMode()
  const { guideActive, currentItem } = useGuideTour()

  const username = (session?.user?.username ?? '').trim().toLowerCase()
  const role = session?.user?.role ?? ''
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.requiresAdmin && role !== 'admin') return false
    if (item.requiresManager && role !== 'manager') return false
    if (!item.visibleForUsernames) return true
    return item.visibleForUsernames.some((u) => u.trim().toLowerCase() === username)
  })
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
      return `${item.name} (Premium - assine para liberar)`
    }
    return item.name
  }

  const handleItemClick = (e: React.MouseEvent, item: (typeof visibleMenuItems)[0]) => {
    if (helpMode && item.helpDescription) {
      e.preventDefault()
      showHelpFor(item, e.currentTarget as HTMLElement)
    }
  }

  return (
    <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
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
            data-guide-href={item.href}
            onClick={(e) => handleItemClick(e, item)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                : isLocked
                  ? 'text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
            } ${helpMode && item.helpDescription ? 'cursor-help' : ''} ${isGuideHighlight ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
          >
            <ItemIcon
              size={16}
              className={`shrink-0 ${
                isActive
                  ? 'text-indigo-700 dark:text-indigo-200'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span>{item.name}</span>
            {isLocked && (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Pro
              </span>
            )}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={() => signOut()}
        title="Sair"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-500/14 dark:hover:text-red-100"
      >
        <LogOut size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
        <span>Sair</span>
      </button>
    </nav>
  )
}
