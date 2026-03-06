'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import type { TaskNotification } from '@/types/notifications'

interface NotificationsContextValue {
  notifications: TaskNotification[]
  isLoading: boolean
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const POLL_INTERVAL_MS = 5 * 60 * 1000
const IDLE_TIMEOUT_MS = 10 * 60 * 1000

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const idleTimeoutRef = useRef<number | null>(null)

  const fetchNotifications = useCallback(async (force = false) => {
    if (status !== 'authenticated' || (!force && isIdle)) return

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
  }, [status, isIdle])

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)

    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current)
    }

    idleTimeoutRef.current = window.setTimeout(() => {
      setIsIdle(true)
    }, IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsIdle(false)
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
      return
    }

    const handleActivity = () => {
      resetIdleTimer()
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointermove',
    ]

    resetIdleTimer()
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      if (idleTimeoutRef.current) {
        window.clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
    }
  }, [status, resetIdleTimer])

  useEffect(() => {
    if (status !== 'authenticated' || isIdle) return

    void fetchNotifications()
    const intervalId = window.setInterval(() => {
      void fetchNotifications()
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, isIdle, fetchNotifications])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        isLoading,
        refresh: () => fetchNotifications(true),
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

