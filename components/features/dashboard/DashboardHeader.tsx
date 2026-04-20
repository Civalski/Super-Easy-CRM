/**
 * Header do dashboard
 * Design consistente com outras paginas do CRM
 */
'use client'

import { RefreshCw, LayoutDashboard, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from '@/lib/icons'
import { usePageHeaderMinimal } from '@/lib/ui/usePageHeaderMinimal'
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'

interface DashboardHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
  filterType: 'day' | 'week' | 'month'
  onFilterChange: (type: 'day' | 'week' | 'month') => void
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DashboardHeader({
  isRefreshing,
  onRefresh,
  filterType,
  onFilterChange,
  selectedDate,
  onDateChange,
}: DashboardHeaderProps) {
  const minimal = usePageHeaderMinimal()
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear())

  useEffect(() => {
    setPickerYear(selectedDate.getFullYear())
  }, [selectedDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement
      if (showMonthPicker && !target.closest('.month-picker-container')) {
        setShowMonthPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMonthPicker])

  const formattedMonth = format(selectedDate, 'MMMM yyyy', { locale: ptBR })
  const now = new Date()
  const isCurrentMonthContext =
    selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear()

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = (() => {
      if (filterType === 'week') {
        const candidate = direction === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1)
        const staysInCurrentMonth =
          candidate.getMonth() === now.getMonth() && candidate.getFullYear() === now.getFullYear()
        return staysInCurrentMonth ? candidate : selectedDate
      }
      return direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1)
    })()

    onDateChange(newDate)
    if (filterType !== 'week') onFilterChange('month')
  }

  const handleTodayClick = () => {
    onDateChange(new Date())
    onFilterChange('day')
  }

  const handleWeekClick = () => {
    onDateChange(new Date())
    onFilterChange('week')
  }

  const handleMonthClick = () => {
    onDateChange(new Date())
    onFilterChange('month')
    setShowMonthPicker(true)
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(pickerYear, monthIndex, 2)
    onDateChange(newDate)
    onFilterChange('month')
    setShowMonthPicker(false)
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      {!minimal && (
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-linear-to-br from-slate-600 to-indigo-500 p-3 shadow-lg shadow-slate-900/45 ring-1 ring-white/10">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visão geral de desempenho</p>
          </div>
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-3 ${minimal ? 'md:ml-auto' : ''}`}>
        <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain px-1 pb-px lg:mx-0 lg:overflow-visible lg:pb-0">
          <div className="z-20 inline-flex min-w-max items-center gap-1 crm-card-soft p-1.5">
          <button
            onClick={handleTodayClick}
            disabled={!isCurrentMonthContext && filterType !== 'day'}
            className={`
              min-h-[44px] min-w-[4.5rem] rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors lg:min-h-0
              ${filterType === 'day'
                ? 'bg-slate-700/80 text-slate-100 ring-[0.5px] ring-slate-500/50 dark:bg-slate-700 dark:text-slate-100'
                : 'text-gray-600 hover:bg-slate-700/45 hover:text-slate-100 dark:text-gray-400'}
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            Hoje
          </button>

          <button
            onClick={handleWeekClick}
            disabled={!isCurrentMonthContext && filterType !== 'week'}
            className={`
              min-h-[44px] min-w-[4.5rem] rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors lg:min-h-0
              ${filterType === 'week'
                ? 'bg-slate-700/80 text-slate-100 ring-[0.5px] ring-slate-500/50 dark:bg-slate-700 dark:text-slate-100'
                : 'text-gray-600 hover:bg-slate-700/45 hover:text-slate-100 dark:text-gray-400'}
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            Semana
          </button>

          <button
            onClick={handleMonthClick}
            className={`
              min-h-[44px] min-w-[4.5rem] rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors lg:min-h-0
              ${filterType === 'month'
                ? 'bg-slate-700/80 text-slate-100 ring-[0.5px] ring-slate-500/50 dark:bg-slate-700 dark:text-slate-100'
                : 'text-gray-600 hover:bg-slate-700/45 hover:text-slate-100 dark:text-gray-400'}
            `}
          >
            Mês
          </button>

          <div className="mx-2 h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-600" />

          <div className="month-picker-container relative flex items-center gap-1">
            <button
              onClick={() => navigatePeriod('prev')}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-slate-700/45 hover:text-slate-100 lg:min-h-0 lg:min-w-0"
              title={filterType === 'week' ? 'Semana anterior' : 'Mes anterior'}
            >
              <ChevronLeft size={18} />
            </button>

            <div
              onClick={() => {
                if (filterType === 'day' || filterType === 'week') {
                  onFilterChange('month')
                } else {
                  setShowMonthPicker(!showMonthPicker)
                }
              }}
              className={`
                relative flex min-h-[44px] min-w-[12.5rem] cursor-pointer select-none items-center justify-center gap-2 rounded-lg px-3 py-1.5 transition-colors lg:min-h-0
                ${filterType === 'month'
                  ? 'bg-slate-700/80 text-slate-100 ring-[0.5px] ring-slate-500/50 dark:bg-slate-700 dark:text-slate-100'
                  : 'text-gray-700 hover:bg-slate-700/45 hover:text-slate-100 dark:text-gray-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100'}
              `}
            >
              <CalendarIcon size={16} className={filterType === 'month' ? 'text-indigo-200 dark:text-slate-300' : 'text-gray-500 dark:text-gray-400'} />
              <span className="text-sm font-semibold capitalize">
                {formattedMonth}
              </span>
            </div>

            {showMonthPicker && filterType === 'month' && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in zoom-in-95 fade-in rounded-xl border border-gray-200 bg-white p-4 shadow-xl duration-200 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => setPickerYear(pickerYear - 1)}
                    className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-bold text-gray-900 dark:text-white">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear(pickerYear + 1)}
                    className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
                          rounded-lg py-2 text-xs font-semibold transition-colors
                          ${isSelected
                            ? 'bg-slate-700 text-white'
                            : isCurrentMonth
                              ? 'bg-slate-700/45 text-indigo-200'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}
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
              onClick={() => navigatePeriod('next')}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-slate-700/45 hover:text-slate-100 lg:min-h-0 lg:min-w-0"
              title={filterType === 'week' ? 'Proxima semana' : 'Proximo mes'}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-300/70 bg-slate-50/85 p-3 text-gray-500 shadow-xs transition-all hover:bg-slate-200/65 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600/65 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:hover:bg-slate-800/75 dark:hover:text-slate-100 lg:min-h-0 lg:min-w-0"
          title="Atualizar dados"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={20} />
        </button>
      </div>
    </div>
  )
}
