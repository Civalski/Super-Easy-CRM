import React, { useState, useRef } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationProps {
    notifications: any[];
    isLoading: boolean;
    onClose: () => void;
    onSelect: (notification: any) => void;
    onClearAll: () => void;
    onDismiss: (id: string) => void;
}

interface SwipeableItemProps {
    notification: any;
    onSelect: (n: any) => void;
    onDismiss: (id: string) => void;
    onClose: () => void;
}

const SwipeableNotificationItem = ({ notification, onSelect, onDismiss, onClose }: SwipeableItemProps) => {
    const SWIPE_ACTION_WIDTH = 72;
    const SWIPE_DISMISS_THRESHOLD = 52;
    const [startX, setStartX] = useState<number | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleStart = (clientX: number) => {
        setStartX(clientX);
        setIsDragging(true);
    };

    const handleMove = (clientX: number) => {
        if (startX === null) return;
        const diff = clientX - startX;
        // Only allow swiping left
        if (diff < 0) {
            const clampedDiff = Math.max(diff, -SWIPE_ACTION_WIDTH);
            setOffsetX(clampedDiff);
        }
    };

    const handleEnd = () => {
        if (offsetX <= -SWIPE_DISMISS_THRESHOLD) {
            // Dismiss threshold
            onDismiss(notification.id);
        }
        setStartX(null);
        setOffsetX(0);
        setIsDragging(false);
    };

    // Mouse events
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => {
        if (isDragging) handleEnd();
    };

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    const isOverdue = (date: string | Date) => {
        const dueDate = new Date(date);
        if (Number.isNaN(dueDate.getTime())) return false;
        return isBefore(startOfDay(dueDate), startOfDay(new Date()));
    };

    const getPriorityColor = (priority: string) => {
        const normalizedPriority = priority
            ?.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        switch (normalizedPriority) {
            case 'alta': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'media': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'baixa': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            default: return 'text-gray-500 bg-gray-50 dark:bg-gray-800';
        }
    };

    const overdue = isOverdue(notification.dataVencimento);
    const swipeProgress = Math.min(Math.max((-offsetX) / SWIPE_ACTION_WIDTH, 0), 1);

    return (
        <div className="relative overflow-hidden w-full border-b border-slate-200/70 dark:border-slate-700/70 last:border-b-0 select-none">
            {/* Background for delete action */}
            <div
                className="absolute inset-y-0 right-0 w-[72px] bg-red-600 flex items-center justify-center pointer-events-none"
                style={{ opacity: swipeProgress, transition: isDragging ? 'none' : 'opacity 0.15s ease-out' }}
            >
                <Trash2 className="text-white" size={20} />
            </div>

            {/* Foreground content */}
            <div
                ref={itemRef}
                className="relative z-10 w-full cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ transform: `translateX(${offsetX}px)`, transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={(e) => {
                    // Prevent click if we were dragging
                    if (offsetX === 0 && !isDragging) {
                        onSelect(notification);
                        onClose();
                    }
                }}
            >
                <div className="w-full px-4 py-3 text-left">
                    <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                            {overdue ? <AlertCircle size={16} /> : <Calendar size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <p className={`text-sm font-medium truncate ${overdue ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>
                                    {notification.titulo}
                                </p>
                                {notification.prioridade && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${getPriorityColor(notification.prioridade)}`}>
                                        {notification.prioridade}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-0.5">
                                {notification.cliente && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {notification.cliente.nome}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Vence em: {format(new Date(notification.dataVencimento), "dd 'de' MMM", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Small helper for users who dont know they can swipe */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                }}
                className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export function NotificationDropdown({ notifications, isLoading, onClose, onSelect, onClearAll, onDismiss }: NotificationProps) {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 crm-card max-h-96 overflow-hidden z-50 flex flex-col">
            <div className="p-3 crm-table-head flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                        {notifications.length}
                    </span>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 size={12} />
                        Limpar tudo
                    </button>
                )}
            </div>

            <div className="overflow-y-auto flex-1">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Carregando...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <CheckCircle2 size={32} className="mb-2 text-green-500 opacity-50" />
                        <p>Tudo em dia!</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notification) => (
                            <SwipeableNotificationItem
                                key={notification.id}
                                notification={notification}
                                onSelect={onSelect}
                                onDismiss={onDismiss}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
