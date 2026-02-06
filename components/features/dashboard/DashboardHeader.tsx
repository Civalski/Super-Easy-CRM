/**
 * Header do dashboard
 * Design consistente com outras páginas do CRM
 */
'use client'

import { RefreshCw, LayoutDashboard, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'

interface DashboardHeaderProps {
    isRefreshing: boolean
    onRefresh: () => void
    filterType: 'day' | 'month'
    onFilterChange: (type: 'day' | 'month') => void
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export function DashboardHeader({
    isRefreshing,
    onRefresh,
    filterType,
    onFilterChange,
    selectedDate,
    onDateChange
}: DashboardHeaderProps) {
    const [showMonthPicker, setShowMonthPicker] = useState(false)
    const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear())

    // Update picker year when selected date changes externally
    useEffect(() => {
        setPickerYear(selectedDate.getFullYear())
    }, [selectedDate])

    // Click outside to close - simple implementation
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (showMonthPicker && !target.closest('.month-picker-container')) {
                setShowMonthPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMonthPicker])

    // Format date for display
    const formattedMonth = format(selectedDate, 'MMMM yyyy', { locale: ptBR })

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = direction === 'prev'
            ? subMonths(selectedDate, 1)
            : addMonths(selectedDate, 1)
        onDateChange(newDate)
        onFilterChange('month')
    }

    const handleTodayClick = () => {
        onDateChange(new Date())
        onFilterChange('day')
    }

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(pickerYear, monthIndex, 2)
        onDateChange(newDate)
        onFilterChange('month')
        setShowMonthPicker(false)
    }

    const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/20 ring-1 ring-black/5">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Visão geral de desempenho
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Controls Container */}
                <div className="flex items-center bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm z-20">
                    {/* Today Button */}
                    <button
                        onClick={handleTodayClick}
                        className={`
                            px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                            ${filterType === 'day'
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                        `}
                    >
                        Hoje
                    </button>

                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    {/* Month Navigator */}
                    <div className="flex items-center gap-1 relative month-picker-container">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Mês anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div
                            onClick={() => {
                                if (filterType === 'day') {
                                    onFilterChange('month')
                                } else {
                                    setShowMonthPicker(!showMonthPicker)
                                }
                            }}
                            className={`
                                relative px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer select-none
                                ${filterType === 'month'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={16} className={filterType === 'month' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} />
                                <span className={`text-sm font-semibold capitalize ${filterType === 'month'
                                    ? 'text-orange-700 dark:text-orange-300'
                                    : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {formattedMonth}
                                </span>
                            </div>
                        </div>

                        {/* Custom Month Picker Dropdown */}
                        {showMonthPicker && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setPickerYear(pickerYear - 1)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-bold text-gray-900 dark:text-white">{pickerYear}</span>
                                    <button
                                        onClick={() => setPickerYear(pickerYear + 1)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {months.map((month, index) => {
                                        const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === pickerYear
                                        const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === pickerYear

                                        return (
                                            <button
                                                key={month}
                                                onClick={() => handleMonthSelect(index)}
                                                className={`
                                                    py-2 text-xs font-semibold rounded-lg transition-colors
                                                    ${isSelected
                                                        ? 'bg-orange-500 text-white'
                                                        : isCurrentMonth
                                                            ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }
                                                `}
                                            >
                                                {month}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Próximo mês"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex items-center justify-center p-3 text-gray-500 hover:text-orange-600 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-700 hover:border-orange-200 dark:hover:border-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    title="Atualizar dados"
                >
                    <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={20} />
                </button>
            </div>
        </div>
    )
}
