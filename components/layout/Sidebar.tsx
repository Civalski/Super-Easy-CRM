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
} from 'lucide-react'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Prospectar',
    href: '/prospectar',
    icon: Target,
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    name: 'Propostas',
    href: '/oportunidades',
    icon: Briefcase,
  },
  {
    name: 'Tarefas',
    href: '/tarefas',
    icon: Calendar,
  },
  {
    name: 'Leads',
    href: '/grupos',
    icon: Layers,
  },
  {
    name: 'Metas',
    href: '/metas',
    icon: Trophy,
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-gray-900 text-white flex flex-col z-50">
      <div className="px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[var(--top-bar-height)]">
        <div className="flex items-center justify-center">
          <Image
            src="/arker10.png"
            alt="Arker CRM"
            width={190}
            height={65}
            className="object-contain"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto flex flex-col">
        <ul className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-auto w-full"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </aside>
  )
}
