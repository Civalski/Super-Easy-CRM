/**
 * Header component
 *
 * Uses:
 * - useGlobalSearch hook
 * - SearchResultsDropdown
 * - NotificationDropdown
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Menu, X } from 'lucide-react'
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch'
import { SearchResultsDropdown } from './SearchResultsDropdown'
import { NotificationDropdown } from './NotificationDropdown'
import TaskNotificationModal from '@/components/features/tarefas/TaskNotificationModal'
import { useSession } from 'next-auth/react'
import type { TaskNotification } from '@/types/notifications'

interface HeaderProps {
  onMobileMenuClick: () => void
}

export default function Header({
  onMobileMenuClick,
}: HeaderProps) {
  const router = useRouter()
  const buscaRef = useRef<HTMLDivElement>(null)
  const notificacaoRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<TaskNotification | null>(null)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  const {
    busca,
    setBusca,
    resultados,
    mostrarResultados,
    carregando,
    totalResultados,
    limparBusca,
    fecharResultados,
    abrirResultados,
  } = useGlobalSearch()

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true)
      const response = await fetch('/api/notificacoes?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar notificacoes:', error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(event.target as Node)) {
        fecharResultados()
      }

      if (notificacaoRef.current && !notificacaoRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickFora)
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
    }
  }, [fecharResultados])

  const handleClienteClick = (id: string) => {
    router.push(`/clientes/${id}`)
    limparBusca()
  }

  const handleOportunidadeClick = (id: string) => {
    router.push('/oportunidades')
    limparBusca()
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'U'
  const userName = session?.user?.name || 'Usuario'
  const userEmail = session?.user?.email

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      fetchNotifications()
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notificacoes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      })

      if (response.ok) {
        setNotifications([])
      }
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error)
    }
  }

  const handleDismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    try {
      await fetch('/api/notificacoes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
    } catch (error) {
      console.error('Erro ao dispensar notificacao:', error)
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-40 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:left-[var(--sidebar-width)]">
      <div className="min-h-[var(--top-bar-height)] border-b border-[color:var(--shell-border)] bg-[var(--shell-tint)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={onMobileMenuClick}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/65 text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={19} />
            </button>
          </div>

          <div className="flex-1 px-1 sm:px-3">
            <div ref={buscaRef} className="relative mx-auto w-full max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
              />
              <input
                type="text"
                placeholder="Buscar clientes, orçamentos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onFocus={abrirResultados}
                className="h-11 w-full rounded-xl border border-slate-600/65 bg-slate-900/55 pl-10 pr-10 text-sm text-slate-100 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
              />
              {busca && (
                <button
                  onClick={limparBusca}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-700/70 hover:text-slate-100"
                  aria-label="Limpar busca"
                >
                  <X size={17} />
                </button>
              )}

              {mostrarResultados && busca.trim().length >= 2 && (
                <SearchResultsDropdown
                  resultados={resultados}
                  carregando={carregando}
                  totalResultados={totalResultados}
                  onClienteClick={handleClienteClick}
                  onOportunidadeClick={handleOportunidadeClick}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div ref={notificacaoRef} className="relative">
              <button
                onClick={toggleNotifications}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/65 text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-slate-100"
                aria-label="Notificacoes"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full border border-white bg-blue-600 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  isLoading={isLoadingNotifications}
                  onClose={() => setShowNotifications(false)}
                  onSelect={(n) => setSelectedNotification(n)}
                  onClearAll={handleClearAllNotifications}
                  onDismiss={handleDismissNotification}
                />
              )}
            </div>

            <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-800/55">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-slate-950/45">
                <span>{userInitial}</span>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-slate-100">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-slate-400">{userEmail}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskNotificationModal
        isOpen={!!selectedNotification}
        task={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onUpdate={fetchNotifications}
      />
    </header>
  )
}
