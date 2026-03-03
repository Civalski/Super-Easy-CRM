'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import type { TaskNotification } from '@/types/notifications'

interface NotificationsContextValue {
  notifications: TaskNotification[]
  isLoading: boolean
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const POLL_INTERVAL_MS = 5 * 60 * 1000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return

    try {
      setIsLoading(true)
      const response = await fetch('/api/notificacoes?limit=100')
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar notificacoes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return

    void fetchNotifications()
    const intervalId = window.setInterval(() => {
      void fetchNotifications()
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, fetchNotifications])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        isLoading,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  }
  return ctx
}

