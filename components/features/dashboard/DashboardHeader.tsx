/**
 * Header do dashboard
 * Design consistente com outras paginas do CRM
 */
'use client'

import { RefreshCw, LayoutDashboard, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
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
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear())

  useEffect(() => {
    setPickerYear(selectedDate.getFullYear())
  }, [selectedDate])

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

  const formattedMonth = format(selectedDate, 'MMMM yyyy', { locale: ptBR })
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const formattedWeek = `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`
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

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(pickerYear, monthIndex, 2)
    onDateChange(newDate)
    onFilterChange('month')
    setShowMonthPicker(false)
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  return (
    <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-linear-to-br from-slate-600 to-indigo-500 p-3 shadow-lg shadow-slate-900/45 ring-1 ring-white/10">
          <LayoutDashboard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visao geral de desempenho</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="z-20 flex items-center crm-card-soft p-1.5">
          <button
            onClick={handleTodayClick}
            disabled={!isCurrentMonthContext && filterType !== 'day'}
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              ${filterType === 'day'
                ? 'bg-slate-700/80 text-slate-100 ring-1 ring-slate-500/60'
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
              rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
              ${filterType === 'week'
                ? 'bg-slate-700/80 text-slate-100 ring-1 ring-slate-500/60'
                : 'text-gray-600 hover:bg-slate-700/45 hover:text-slate-100 dark:text-gray-400'}
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            Semana
          </button>

          <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="month-picker-container relative flex items-center gap-1">
            <button
              onClick={() => navigatePeriod('prev')}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-slate-700/45 hover:text-slate-100"
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
                relative cursor-pointer select-none rounded-lg px-3 py-1.5 transition-all duration-200
                ${filterType === 'month'
                  ? 'bg-slate-700/80 ring-1 ring-slate-500/60'
                  : 'hover:bg-slate-700/45'}
              `}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className={filterType === 'month' ? 'text-indigo-200' : 'text-gray-400'} />
                <span
                  className={`text-sm font-semibold capitalize ${filterType === 'month'
                    ? 'text-slate-100'
                    : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {filterType === 'week' ? formattedWeek : formattedMonth}
                </span>
              </div>
            </div>

            {showMonthPicker && filterType === 'month' && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 animate-in zoom-in-95 fade-in rounded-xl border border-gray-200 bg-white p-4 shadow-xl duration-200 dark:border-gray-700 dark:bg-gray-900">
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
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-slate-700/45 hover:text-slate-100"
              title={filterType === 'week' ? 'Proxima semana' : 'Proximo mes'}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center rounded-xl border border-slate-300/70 bg-slate-50/85 p-3 text-gray-500 shadow-xs transition-all hover:bg-slate-200/65 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600/65 dark:bg-slate-900/60 dark:hover:border-slate-500 dark:hover:bg-slate-800/75 dark:hover:text-slate-100"
          title="Atualizar dados"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={20} />
        </button>
      </div>
    </div>
  )
}
