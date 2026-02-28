'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Settings,
  BarChart3,
  Trophy,
  LogOut,
  Layers,
  Target,
  X,
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  isMobile?: boolean
  onClose?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
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
    name: 'Oportunidades',
    href: '/oportunidades',
    icon: Briefcase,
  },
  {
    name: 'Tarefas',
    href: '/tarefas',
    icon: Calendar,
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
  {
    name: 'Relatorios',
    href: '/relatorios',
    icon: BarChart3,
  },
  {
    name: 'Configuracoes',
    href: '/configuracoes',
    icon: Settings,
  },
]

export default function Sidebar({
  collapsed = false,
  isMobile = false,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: SidebarProps) {
  const pathname = usePathname()
  const isCompact = collapsed && !isMobile
  const sidebarWidthClass = isCompact ? 'w-[4.5rem]' : isMobile ? 'w-72 max-w-[85vw]' : 'w-64'
  const topBarLayoutClass = isCompact ? 'justify-center' : isMobile ? 'justify-between' : 'justify-center'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 ${sidebarWidthClass} text-slate-100 transition-[width] duration-300`}
      onMouseEnter={isMobile ? undefined : onMouseEnter}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
    >
      <div className="flex h-full flex-col border-r border-slate-600/35 bg-gradient-to-b from-slate-900/95 via-slate-900/92 to-slate-800/90 backdrop-blur-xl shadow-[0_24px_55px_-35px_rgba(2,6,23,0.95)]">
        <div
          className={`flex min-h-[var(--top-bar-height)] items-center border-b border-slate-600/30 px-4 ${topBarLayoutClass}`}
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
                className="h-10 w-10 rounded-2xl object-contain"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-500/30 text-slate-300 hover:bg-slate-700/70 hover:text-slate-100"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.name}
                    onClick={onClose}
                    className={`group flex items-center rounded-xl transition-all duration-200 ${isCompact ? 'h-11 justify-center px-0' : 'h-11 gap-3 px-3.5'} ${isActive
                      ? 'border border-indigo-300/16 bg-indigo-400/10 text-white shadow-[0_10px_20px_-16px_rgba(99,102,241,0.25)]'
                      : 'text-slate-200/90 hover:bg-slate-700/55 hover:text-white'
                      }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-indigo-200' : 'text-slate-300 group-hover:text-slate-100'}
                    />
                    {!isCompact && (
                      <>
                        <span className="truncate text-sm font-medium tracking-wide">
                          {item.name}
                        </span>
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-auto space-y-2 pt-2">
            <button
              type="button"
              onClick={() => signOut()}
              title="Sair"
              className={`flex h-11 w-full items-center rounded-xl border border-slate-500/30 text-slate-200 transition-colors hover:border-red-300/30 hover:bg-red-500/14 hover:text-red-100 ${isCompact ? 'justify-center px-0' : 'gap-3 px-3.5'}`}
            >
              <LogOut size={18} />
              {!isCompact && <span className="text-sm font-medium">Sair</span>}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}
