'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Briefcase,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ClipboardList,
  Compass,
  Database,
  Folder,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageSquareText,
  Package,
  Settings,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
} from 'lucide-react'

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

interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
}

interface MenuCategory {
  id: string
  name: string
  icon: LucideIcon
  items: MenuItem[]
}

const menuCategories: MenuCategory[] = [
  {
    id: 'visao-geral',
    name: 'Visao geral',
    icon: Compass,
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Relatorios',
        href: '/relatorios',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'comercial',
    name: 'Comercial',
    icon: Folder,
    items: [
      {
        name: 'Leads',
        href: '/prospectar',
        icon: Target,
      },
      {
        name: 'Clientes',
        href: '/clientes',
        icon: Users,
      },
      {
        name: 'Orcamentos',
        href: '/oportunidades',
        icon: Briefcase,
      },
      {
        name: 'Pedidos',
        href: '/pedidos',
        icon: ClipboardList,
      },
      {
        name: 'Funil',
        href: '/grupos',
        icon: Layers,
      },
      {
        name: 'Metas',
        href: '/metas',
        icon: Trophy,
      },
    ],
  },
  {
    id: 'operacao',
    name: 'Operacao',
    icon: Settings,
    items: [
      {
        name: 'Tarefas',
        href: '/tarefas',
        icon: Calendar,
      },
      {
        name: 'Templates',
        href: '/followups/templates',
        icon: MessageSquareText,
      },
    ],
  },
  {
    id: 'cadastro',
    name: 'Cadastro',
    icon: Database,
    items: [
      {
        name: 'Produtos',
        href: '/produtos',
        icon: Package,
      },
      {
        name: 'Financeiro',
        href: '/financeiro',
        icon: Wallet,
      },
    ],
  },
]

const compactMenuItems: MenuItem[] = menuCategories.flatMap((category) => category.items)

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
  const [openCategories, setOpenCategories] = useState<string[]>(
    () => menuCategories.map((category) => category.id)
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
    const activeCategoryIds = menuCategories
      .filter((category) =>
        category.items.some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        )
      )
      .map((category) => category.id)

    if (activeCategoryIds.length === 0) return

    setOpenCategories((prev) => {
      const merged = new Set(prev)
      activeCategoryIds.forEach((id) => merged.add(id))
      const next = Array.from(merged)

      if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
        return prev
      }

      return next
    })
  }, [pathname])

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 ${sidebarWidthClass} ${mobileTransformClass} text-slate-800 transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-slate-100`}
      onMouseEnter={isMobile ? undefined : onMouseEnter}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
    >
      <div className="flex h-full flex-col border-r border-slate-200/80 bg-linear-to-b from-slate-200 via-slate-200/98 to-slate-300/95 backdrop-blur-xl shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] dark:border-slate-600/35 dark:from-slate-900/95 dark:via-slate-900/92 dark:to-slate-800/90 dark:shadow-[0_24px_55px_-35px_rgba(2,6,23,0.95)]">
        <div
          className={`flex min-h-(--top-bar-height) items-center border-b border-slate-200/80 px-4 dark:border-slate-600/30 ${topBarLayoutClass}`}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`group flex items-center ${isCompact ? 'justify-center' : 'justify-center'} ${isMobile ? '' : 'w-full'}`}
          >
            {isCompact ? (
              <Image
                src="/arker-a.png"
                alt="Arker CRM"
                width={40}
                height={40}
                className="h-10 w-10 rounded-2xl object-contain transition-opacity group-hover:opacity-90"
                priority
              />
            ) : (
              <Image
                src="/arker10.png"
                alt="Arker CRM"
                width={156}
                height={52}
                className="h-10 w-auto object-contain brightness-110 saturate-110 transition-opacity group-hover:opacity-90"
                priority
              />
            )}
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

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {isCompact ? (
            <ul className="space-y-1.5">
              {compactMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.name}
                      onClick={onClose}
                      className={`group flex h-11 items-center justify-center rounded-xl px-0 transition-all duration-200 ${
                        isActive
                          ? 'border border-indigo-300/45 bg-indigo-100/80 text-indigo-800 shadow-[0_10px_20px_-16px_rgba(99,102,241,0.2)] dark:border-indigo-300/16 dark:bg-indigo-400/10 dark:text-white dark:shadow-[0_10px_20px_-16px_rgba(99,102,241,0.25)]'
                          : 'text-slate-700 hover:bg-slate-100/85 hover:text-slate-900 dark:text-slate-200/90 dark:hover:bg-slate-700/55 dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 ${
                          isActive ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-100'
                        }`}
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <ul className="space-y-2">
              {menuCategories.map((category) => {
                const CategoryIcon = category.icon
                const isCategoryOpen = openCategories.includes(category.id)
                const hasActiveItem = category.items.some((item) => isItemActive(item.href))

                return (
                  <li key={category.id} className="rounded-xl border border-slate-200 bg-white/85 dark:border-slate-600/20 dark:bg-slate-900/30">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      aria-expanded={isCategoryOpen}
                      className={`group flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left transition-colors duration-200 ${
                        hasActiveItem
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/40 dark:hover:text-slate-100'
                      }`}
                    >
                      <CategoryIcon
                        size={16}
                        className={`${
                          hasActiveItem
                            ? 'text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.08em]">
                        {category.name}
                      </span>
                      <ChevronRight
                        size={15}
                        className={`shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
                          isCategoryOpen ? 'rotate-90 text-slate-700 dark:text-slate-200' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                        isCategoryOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <ul className="min-h-0 space-y-1 overflow-hidden px-2 pb-2">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon
                          const isActive = isItemActive(item.href)

                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                title={item.name}
                                onClick={onClose}
                                className={`group flex h-9 items-center rounded-lg px-2.5 transition-colors duration-200 ${
                                  isActive
                                    ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-400/10 dark:text-white'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/55 dark:hover:text-white'
                                }`}
                              >
                                <ItemIcon
                                  size={16}
                                  className={`shrink-0 ${
                                    isActive
                                      ? 'text-indigo-700 dark:text-indigo-200'
                                      : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-100'
                                  }`}
                                />
                                <span className="ml-2.5 truncate text-sm font-medium tracking-wide">
                                  {item.name}
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

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
              className={`flex h-11 w-full items-center rounded-xl border border-slate-300/80 text-slate-700 transition-all duration-200 hover:border-red-300/70 hover:bg-red-50 hover:text-red-700 dark:border-slate-500/30 dark:text-slate-200 dark:hover:border-red-300/30 dark:hover:bg-red-500/14 dark:hover:text-red-100 ${isCompact ? 'justify-center px-0' : 'justify-start px-3.5'}`}
            >
              <LogOut size={18} className="shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,opacity,transform,margin-left] duration-200 ease-out ${isCompact
                  ? 'ml-0 max-w-0 -translate-x-1 opacity-0'
                  : 'ml-3 max-w-36 translate-x-0 opacity-100'
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
