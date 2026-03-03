'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'
import { useNotifications } from './NotificationsProvider'
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

    useEffect(() => {
        if (pathname === '/login' || pathname === '/register') return
        if (status !== 'authenticated') return
        if (document.visibilityState !== 'visible') return

        if ('Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission()
        }

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 8000,
            timerProgressBar: true,
            background: '#fff',
            color: '#1f2937',
            iconColor: '#2563eb',
            customClass: {
                popup: 'colored-toast shadow-lg rounded-lg border border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white',
            },
            didOpen: (toast: HTMLElement) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            },
        })

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
                if (!tarefa.notificar || !tarefa.dataVencimento || tarefa.status === 'concluida') return

                const vencimento = new Date(tarefa.dataVencimento)
                const diffInMs = vencimento.getTime() - now.getTime()
                const isDueSoonOrJustPassed = diffInMs > -5 * 60 * 1000 && diffInMs < 1.5 * 60 * 1000

                if (isDueSoonOrJustPassed && !seenIds.has(tarefa.id)) {
                    Toast.fire({
                        icon: 'info',
                        title: 'Lembrete de Tarefa',
                        html: `
                                <div class="flex flex-col gap-1">
                                    <span class="font-bold text-lg">${tarefa.titulo || 'Tarefa sem titulo'}</span>
                                    <span class="text-sm">Vence as ${vencimento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            `,
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

                    try {
                        const audio = new Audio('/notification.mp3')
                        void audio.play()
                    } catch {
                        // no-op
                    }

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
