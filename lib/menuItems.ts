import type { LucideIcon } from '@/lib/icons'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Layers,
  Package,
  Trophy,
  Users,
  Wallet,
} from '@/lib/icons'

export interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
  requiresPremium?: boolean
  /** Quando definido, o item só aparece para usuários cujo username está na lista (ex: admin) */
  visibleForUsernames?: string[]
}

export const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Relatorios', href: '/relatorios', icon: BarChart3, visibleForUsernames: ['alisson355'] },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Orçamentos', href: '/oportunidades', icon: FileText },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
  { name: 'Funil', href: '/grupos', icon: Layers },
  { name: 'Metas', href: '/metas', icon: Trophy },
  { name: 'Tarefas', href: '/tarefas', icon: Calendar },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet, requiresPremium: true },
]
