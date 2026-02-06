'use client'

import { useEffect } from 'react'
import Swal from 'sweetalert2'

export function NotificationManager() {
    useEffect(() => {
        // Solicitar permissão de notificações ao carregar
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
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
            }
        })

        const checkTasks = async () => {
            try {
                const response = await fetch('/api/tarefas')
                if (!response.ok) return
                const tarefas = await response.json()

                if (!Array.isArray(tarefas)) return

                const now = new Date()
                const notifiedTasks = JSON.parse(localStorage.getItem('notifiedTasks') || '[]')
                let updatedNotifiedTasks = [...notifiedTasks]
                let hasNewNotifications = false

                tarefas.forEach((tarefa: any) => {
                    if (!tarefa.notificar || !tarefa.dataVencimento || tarefa.status === 'concluida') return

                    const vencimento = new Date(tarefa.dataVencimento)
                    const diffInMs = vencimento.getTime() - now.getTime()

                    // Critério: venceu recentemente ou vai vencer logo
                    // -5 min até +1.5 min
                    const isDueSoonOrJustPassed = diffInMs > -5 * 60 * 1000 && diffInMs < 1.5 * 60 * 1000

                    if (isDueSoonOrJustPassed && !updatedNotifiedTasks.includes(tarefa.id)) {
                        // 1. Notificação Bonita no App (SweetAlert2)
                        Toast.fire({
                            icon: 'info',
                            title: 'Lembrete de Tarefa',
                            html: `
                                <div class="flex flex-col gap-1">
                                    <span class="font-bold text-lg">${tarefa.titulo || 'Tarefa sem título'}</span>
                                    <span class="text-sm">Vence às ${vencimento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            `
                        })

                        // 2. Notificação Nativa do Navegador (se permitido)
                        if ('Notification' in window && Notification.permission === 'granted') {
                            try {
                                new Notification(`Lembrete: ${tarefa.titulo}`, {
                                    body: `Vencimento: ${vencimento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                                    tag: `tarefa-${tarefa.id}`,
                                    requireInteraction: true,
                                    // Ícone opcional se tiver no projeto
                                    // icon: '/icons/icon-192x192.png'
                                })
                            } catch (e) {
                                console.error('Erro ao criar notificação nativa:', e)
                            }
                        }

                        // Tenta tocar som (opcional, requer interação prévia com a página em alguns browsers)
                        try {
                            const audio = new Audio('/notification.mp3')
                            audio.play().catch(() => { })
                        } catch (e) { }

                        updatedNotifiedTasks.push(tarefa.id)
                        hasNewNotifications = true
                    }
                })

                if (hasNewNotifications) {
                    localStorage.setItem('notifiedTasks', JSON.stringify(updatedNotifiedTasks))
                }

            } catch (error) {
                console.error('Erro ao verificar notificação de tarefas:', error)
            }
        }

        const intervalId = setInterval(checkTasks, 30000)
        checkTasks()

        return () => clearInterval(intervalId)
    }, [])

    return null
}
