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
import { Search, Bell, Menu, X, Settings, QuestionMarkCircle } from '@/lib/icons'
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch'
import { SearchResultsDropdown } from './SearchResultsDropdown'
import { NotificationDropdown } from './NotificationDropdown'
import TaskNotificationModal from '@/components/features/tarefas/TaskNotificationModal'
import { useSession } from 'next-auth/react'
import type { TaskNotification } from '@/types/notifications'
import { useNotifications } from '@/components/features/tarefas/NotificationsProvider'

interface HeaderProps {
  onMobileMenuClick: () => void
  onOpenConfig?: () => void
  menuLayout?: 'sidebar' | 'header'
}

import { HeaderNav } from './HeaderNav'
import { useHelpMode } from './HelpModeProvider'

export default function Header({
  onMobileMenuClick,
  onOpenConfig,
  menuLayout = 'sidebar',
}: HeaderProps) {
  const router = useRouter()
  const buscaRef = useRef<HTMLDivElement>(null)
  const notificacaoRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const { notifications, isLoading, refresh } = useNotifications()
  const { helpMode, toggleHelpMode } = useHelpMode()

  const [localNotifications, setLocalNotifications] = useState<TaskNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<TaskNotification | null>(null)

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

  useEffect(() => {
    setLocalNotifications(Array.isArray(notifications) ? notifications : [])
  }, [notifications])

  useEffect(() => {
    const handleClickFora = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (buscaRef.current && !buscaRef.current.contains(target)) {
        fecharResultados()
      }

      if (notificacaoRef.current && !notificacaoRef.current.contains(target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickFora)
    document.addEventListener('touchstart', handleClickFora, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickFora)
      document.removeEventListener('touchstart', handleClickFora)
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

  const handlePedidoClick = (id: string) => {
    router.push(`/pedidos?pedidoId=${id}`)
    limparBusca()
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || 'U'
  const userName = session?.user?.name || 'Usuario'
  const userEmail = session?.user?.email

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && localNotifications.length === 0) {
      void refresh()
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
        setLocalNotifications([])
      }
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error)
    }
  }

  const handleDismissNotification = async (id: string) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id))

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
    <header
      className={`fixed left-0 right-0 top-0 z-40 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        menuLayout === 'header' ? 'lg:left-0' : 'lg:left-(--sidebar-width)'
      }`}
    >
        <div className="min-h-(--top-bar-height) border-b border-(--shell-border) bg-(--shell-tint) backdrop-blur-xs pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 min-w-0">
            {menuLayout === 'header' && (
              <div className="hidden lg:block shrink-0">
                <HeaderNav />
              </div>
            )}
            <button
              onClick={onMobileMenuClick}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300/70 text-slate-700 transition-colors hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/80 dark:border-slate-600/65 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 dark:active:bg-slate-600/70 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex-1 px-1 sm:px-3">
            <div
              ref={buscaRef}
              className="relative flex mx-auto w-full max-w-2xl items-center gap-0 overflow-hidden rounded-xl border border-slate-300/70 bg-white/80 transition focus-within:border-indigo-400/70 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-600/65 dark:bg-slate-900/55"
            >
              <div
                className="flex h-10 min-h-[44px] w-10 shrink-0 cursor-default items-center justify-center text-slate-500 dark:text-slate-400 sm:h-11"
                aria-hidden
                onMouseDown={(e) => e.preventDefault()}
              >
                <Search size={19} />
              </div>
              <input
                type="text"
                placeholder="Buscar clientes, orcamentos, pedidos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onFocus={abrirResultados}
                className="h-10 min-h-[44px] min-w-0 flex-1 border-0 bg-transparent py-2 pl-2 pr-2 text-base text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400 sm:h-11 sm:text-sm"
              />
              {busca ? (
                <button
                  type="button"
                  onClick={limparBusca}
                  className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
                  aria-label="Limpar busca"
                >
                  <X size={17} />
                </button>
              ) : (
                <div
                  className="h-10 min-h-[44px] w-10 shrink-0 cursor-default sm:h-11"
                  aria-hidden
                  onMouseDown={(e) => e.preventDefault()}
                />
              )}

              {mostrarResultados && busca.trim().length >= 2 && (
                <SearchResultsDropdown
                  resultados={resultados}
                  carregando={carregando}
                  totalResultados={totalResultados}
                  onClienteClick={handleClienteClick}
                  onOportunidadeClick={handleOportunidadeClick}
                  onPedidoClick={handlePedidoClick}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleHelpMode}
              className={`relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors lg:h-9 lg:w-9 ${
                helpMode
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/20 dark:text-indigo-300'
                  : 'border-slate-300/70 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:border-slate-600/65 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100'
              }`}
              aria-label="Modo ajuda"
              title={helpMode ? 'Clique nas abas do menu para ver explicações' : 'Ativar modo ajuda'}
            >
              <QuestionMarkCircle size={20} />
            </button>

            <div ref={notificacaoRef} className="relative">
              <button
                onClick={toggleNotifications}
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300/70 text-slate-700 transition-colors hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/80 dark:border-slate-600/65 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 dark:active:bg-slate-600/70 lg:h-9 lg:w-9"
                aria-label="Notificacoes"
              >
                <Bell size={18} />
                {localNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full border border-white bg-blue-600 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-900">
                    {localNotifications.length > 9 ? '9+' : localNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  notifications={localNotifications}
                  isLoading={isLoading}
                  onClose={() => setShowNotifications(false)}
                  onSelect={(n) => setSelectedNotification(n)}
                  onClearAll={handleClearAllNotifications}
                  onDismiss={handleDismissNotification}
                />
              )}
            </div>

            <button
              type="button"
              onClick={onOpenConfig ?? (() => router.push('/configuracoes'))}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300/70 text-slate-700 transition-colors hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/80 dark:border-slate-600/65 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 dark:active:bg-slate-600/70 lg:h-9 lg:w-9"
              aria-label="Configurações"
              title="Configurações"
            >
              <Settings size={18} />
            </button>

            <div className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/55 sm:gap-3 sm:px-2 sm:py-1.5">
              <div className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-linear-to-br from-slate-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-slate-950/45 lg:h-9 lg:w-9">
                <span>{userInitial}</span>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
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
        onUpdate={refresh}
      />
    </header>
  )
}
