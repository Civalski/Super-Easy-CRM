'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useNotifications } from './NotificationsProvider'
import { useNotificationSound } from '@/lib/hooks/useNotificationSound'
const STORAGE_KEY = 'notifiedTasks'
const MAX_STORED_TASK_IDS = 500

interface NotificationTask {
    id: string
    titulo?: string | null
    status?: string | null
    notificar?: boolean
    dataVencimento?: string | Date | null
}

function isNotificationTask(value: unknown): value is NotificationTask {
    if (!value || typeof value !== 'object') return false
    const task = value as Record<string, unknown>
    return typeof task.id === 'string'
}

function readNotifiedTaskIds() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        if (!Array.isArray(parsed)) return []
        return parsed.filter((value): value is string => typeof value === 'string')
    } catch {
        return []
    }
}

function writeNotifiedTaskIds(ids: string[]) {
    const trimmed = ids.slice(-MAX_STORED_TASK_IDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function NotificationManager() {
    const pathname = usePathname()
    const { status } = useSession()
    const { notifications } = useNotifications()

    const { playSound } = useNotificationSound()

    useEffect(() => {
        if (pathname === '/login' || pathname === '/register') return
        if (status !== 'authenticated') return
        if (document.visibilityState !== 'visible') return

        if ('Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission()
        }

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return
        }

        try {
            const now = new Date()
            const notifiedTaskIds = readNotifiedTaskIds()
            const seenIds = new Set(notifiedTaskIds)
            let hasNewNotifications = false

            notifications.forEach((rawTask) => {
                if (!isNotificationTask(rawTask)) return

                const tarefa = rawTask
                const dataParaAviso = tarefa.dataAviso ?? tarefa.dataVencimento
                if (!tarefa.notificar || !dataParaAviso || tarefa.status === 'concluida') return

                const vencimento = new Date(dataParaAviso)
                const diffInMs = vencimento.getTime() - now.getTime()
                const isDueSoonOrJustPassed = diffInMs > -5 * 60 * 1000 && diffInMs < 1.5 * 60 * 1000

                if (isDueSoonOrJustPassed && !seenIds.has(tarefa.id)) {
                    toast.info('Lembrete de Tarefa', {
                        description: `${tarefa.titulo || 'Tarefa sem titulo'} — Vence às ${vencimento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                        duration: 8000,
                    })

                    if ('Notification' in window && Notification.permission === 'granted') {
                        try {
                            new Notification(`Lembrete: ${tarefa.titulo || 'Tarefa'}`, {
                                body: `Vencimento: ${vencimento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                                tag: `tarefa-${tarefa.id}`,
                                requireInteraction: true,
                            })
                        } catch (error) {
                            console.error('Erro ao criar notificacao nativa:', error)
                        }
                    }

                    playSound()

                    notifiedTaskIds.push(tarefa.id)
                    seenIds.add(tarefa.id)
                    hasNewNotifications = true
                }
            })

            if (hasNewNotifications) {
                writeNotifiedTaskIds(notifiedTaskIds)
            }
        } catch (error) {
            console.error('Erro ao verificar notificacoes de tarefas:', error)
        }
    }, [pathname, status, notifications])

    return null
}
