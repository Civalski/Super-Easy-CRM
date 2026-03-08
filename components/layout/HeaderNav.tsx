'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { menuItems } from '@/lib/menuItems'
import { isBillingSubscriptionEnabledClient } from '@/lib/billing/feature-toggle'

export function HeaderNav() {
  const pathname = usePathname()
  const billingSubscriptionEnabled = isBillingSubscriptionEnabledClient()
  const [premiumAccess, setPremiumAccess] = useState<'loading' | 'active' | 'inactive' | 'error'>(
    billingSubscriptionEnabled ? 'loading' : 'active'
  )

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    if (!billingSubscriptionEnabled) return

    let cancelled = false

    async function loadPremiumAccess() {
      try {
        const response = await fetch('/api/billing/mercado-pago/subscription', {
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

  const getResolvedHref = (item: (typeof menuItems)[0]) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return '/configuracoes'
    }
    return item.href
  }

  const getResolvedTitle = (item: (typeof menuItems)[0]) => {
    if (item.requiresPremium && premiumAccess === 'inactive') {
      return `${item.name} (Premium - assine para liberar)`
    }
    return item.name
  }

  return (
    <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
      {menuItems.map((item) => {
        const ItemIcon = item.icon
        const isActive = isItemActive(item.href)
        const isLocked = item.requiresPremium && premiumAccess === 'inactive'
        const href = getResolvedHref(item)
        const title = getResolvedTitle(item)

        return (
          <Link
            key={item.href}
            href={href}
            title={title}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                : isLocked
                  ? 'text-slate-500 hover:bg-amber-50/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-300'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
            }`}
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
    </nav>
  )
}
