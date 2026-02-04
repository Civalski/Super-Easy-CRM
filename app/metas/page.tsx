'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common'
import { Loader2, Plus, Trash2, Pencil, Target } from 'lucide-react'
import Swal from 'sweetalert2'

type GoalMetricType =
  | 'CLIENTES_CONTATADOS'
  | 'PROPOSTAS'
  | 'CLIENTES_CADASTRADOS'
  | 'VENDAS'
  | 'QUALIFICACAO'
  | 'NEGOCIACAO'
  | 'PROSPECCAO'

type GoalPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

interface Goal {
  id: string
  title?: string | null
  metricType: GoalMetricType
  periodType: GoalPeriodType
  target: number
  startDate?: string | null
  endDate?: string | null
  weekDays: number[]
  createdAt: string
  updatedAt: string
  current?: number
  progress?: number
  periodStart?: string
  periodEnd?: string
  active?: boolean
}

interface GoalFormState {
  title: string
  metricType: GoalMetricType
  periodType: GoalPeriodType
  target: string
  startDate: string
  endDate: string
  weekDays: number[]
  useDateRange: boolean
}

const metricOptions: Array<{ value: GoalMetricType; label: string }> = [
  { value: 'CLIENTES_CONTATADOS', label: 'Clientes contatados' },
  { value: 'PROPOSTAS', label: 'Propostas' },
  { value: 'CLIENTES_CADASTRADOS', label: 'Clientes cadastrados' },
  { value: 'VENDAS', label: 'Vendas' },
  { value: 'QUALIFICACAO', label: 'Qualificacao' },
  { value: 'NEGOCIACAO', label: 'Negociacao' },
  { value: 'PROSPECCAO', label: 'Prospeccao' },
]

const periodOptions: Array<{ value: GoalPeriodType; label: string }> = [
  { value: 'DAILY', label: 'Diaria' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'CUSTOM', label: 'Personalizada' },
]

const weekDayOptions = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

function toInputDate(date?: Date | null) {
  if (!date) return ''
  const offset = date.getTimezoneOffset()
  const adjusted = new Date(date.getTime() - offset * 60000)
  return adjusted.toISOString().slice(0, 10)
}

function getStartOfWeek(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  return value
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

function getDefaultDates(periodType: GoalPeriodType) {
  const now = new Date()
  switch (periodType) {
    case 'DAILY': {
      const today = toInputDate(now)
      return { startDate: today, endDate: today }
    }
    case 'WEEKLY': {
      const start = getStartOfWeek(now)
      const end = getEndOfWeek(now)
      return { startDate: toInputDate(start), endDate: toInputDate(end) }
    }
    case 'MONTHLY': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { startDate: toInputDate(start), endDate: toInputDate(end) }
    }
    case 'CUSTOM':
    default: {
      const today = toInputDate(now)
      return { startDate: today, endDate: today }
    }
  }
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default function MetasPage() {
  const initialDates = useMemo(() => getDefaultDates('DAILY'), [])
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GoalFormState>({
    title: '',
    metricType: 'CLIENTES_CONTATADOS',
    periodType: 'DAILY',
    target: '1',
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    weekDays: [],
    useDateRange: false,
  })

  const swalBase = {
    background: '#0f172a',
    color: '#e5e7eb',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  }

  const handleUnauthorized = () => {
    setError('Sua sessao expirou. Entre novamente para continuar.')
    router.push('/login')
  }

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/metas', { credentials: 'include' })
      if (response.status === 401) {
        handleUnauthorized()
        return
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setGoals(data)
      } else {
        console.error('API de metas retornou dados em formato inesperado:', data)
        setGoals([])
      }
    } catch (err) {
      console.error('Erro ao buscar metas:', err)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const resetForm = () => {
    const defaults = getDefaultDates('DAILY')
    setForm({
      title: '',
      metricType: 'CLIENTES_CONTATADOS',
      periodType: 'DAILY',
      target: '1',
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      weekDays: [],
      useDateRange: false,
    })
    setEditingId(null)
  }

  const handlePeriodTypeChange = (periodType: GoalPeriodType) => {
    setForm((prev) => {
      const defaults = getDefaultDates(periodType)
      const shouldUseDateRange =
        periodType === 'CUSTOM'
          ? true
          : prev.periodType === 'CUSTOM'
            ? false
            : prev.useDateRange
      return {
        ...prev,
        periodType,
        useDateRange: shouldUseDateRange,
        startDate: shouldUseDateRange ? defaults.startDate : prev.startDate,
        endDate: shouldUseDateRange ? defaults.endDate : prev.endDate,
        weekDays: periodType === 'WEEKLY' ? prev.weekDays : [],
      }
    })
  }

  const toggleWeekDay = (day: number) => {
    setForm((prev) => {
      const exists = prev.weekDays.includes(day)
      const next = exists ? prev.weekDays.filter((d) => d !== day) : [...prev.weekDays, day]
      return {
        ...prev,
        weekDays: next.sort((a, b) => a - b),
      }
    })
  }

  const toggleDateRange = () => {
    setForm((prev) => {
      const nextUseDateRange = !prev.useDateRange
      if (!nextUseDateRange) {
        return { ...prev, useDateRange: false }
      }
      const defaults = getDefaultDates(prev.periodType)
      return {
        ...prev,
        useDateRange: true,
        startDate: defaults.startDate,
        endDate: defaults.endDate,
      }
    })
  }

  const handleEdit = (goal: Goal) => {
    const defaults = getDefaultDates(goal.periodType)
    const hasDateRange = Boolean(goal.startDate) && Boolean(goal.endDate)
    const startDate = goal.startDate ? toInputDate(new Date(goal.startDate)) : defaults.startDate
    const endDate = goal.endDate ? toInputDate(new Date(goal.endDate)) : defaults.endDate
    setEditingId(goal.id)
    setError(null)
    setForm({
      title: goal.title ?? '',
      metricType: goal.metricType,
      periodType: goal.periodType,
      target: String(goal.target),
      startDate,
      endDate,
      weekDays: goal.weekDays ?? [],
      useDateRange: goal.periodType === 'CUSTOM' ? true : hasDateRange,
    })
  }

  const handleDelete = async (goalId: string) => {
    const resultado = await Swal.fire({
      ...swalBase,
      title: 'Excluir meta?',
      text: 'Essa acao nao pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!resultado.isConfirmed) return

    try {
      const response = await fetch(`/api/metas/${goalId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.status === 401) {
        handleUnauthorized()
        return
      }
      if (response.ok) {
        setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
        if (editingId === goalId) {
          resetForm()
        }
      } else {
        const data = await response.json()
        await Swal.fire({
          ...swalBase,
          icon: 'error',
          title: 'Erro ao excluir',
          text: data.error || 'Erro ao excluir meta',
        })
      }
    } catch (err) {
      console.error('Erro ao excluir meta:', err)
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Erro ao excluir',
        text: 'Erro ao excluir meta. Tente novamente.',
      })
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const shouldSendDates = form.periodType === 'CUSTOM' || form.useDateRange
      const trimmedTitle = form.title.trim()
      const payload = {
        title: trimmedTitle ? trimmedTitle : null,
        metricType: form.metricType,
        periodType: form.periodType,
        target: Number(form.target),
        startDate: shouldSendDates ? form.startDate : null,
        endDate: shouldSendDates ? form.endDate : null,
        weekDays: form.periodType === 'WEEKLY' ? form.weekDays : [],
      }

      const response = await fetch(editingId ? `/api/metas/${editingId}` : '/api/metas', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (response.ok) {
        await fetchGoals()
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao salvar meta')
      }
    } catch (err) {
      console.error('Erro ao salvar meta:', err)
      setError('Erro ao salvar meta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeGoals = goals.filter((goal) => goal.active !== false)
  const automaticGoals = activeGoals.filter(
    (goal) => !goal.startDate && !goal.endDate && goal.periodType !== 'CUSTOM'
  )
  const completedGoals = activeGoals.filter((goal) => (goal.progress ?? 0) >= 100)
  const averageProgress = activeGoals.length
    ? Math.round(
      activeGoals.reduce((sum, goal) => sum + (goal.progress ?? 0), 0) /
      activeGoals.length
    )
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Header Padronizado */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Metas e Objetivos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Defina e acompanhe suas metas automáticas e personalizadas
            </p>
          </div>
        </div>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Metas Ativas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {activeGoals.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Automáticas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {automaticGoals.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Concluídas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {completedGoals.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Média de Progresso</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {averageProgress}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2 ml-2">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(averageProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4 h-fit xl:col-span-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Editar meta' : 'Nova meta'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancelar edicao
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Titulo (opcional)
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Meta personalizada"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de meta
            <select
              value={form.metricType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, metricType: event.target.value as GoalMetricType }))
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Periodo
            <select
              value={form.periodType}
              onChange={(event) => handlePeriodTypeChange(event.target.value as GoalPeriodType)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {form.periodType !== 'CUSTOM' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Limitar por datas
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.useDateRange
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                      {form.useDateRange ? 'Ativo' : 'Automatico'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Desmarcado = meta automatica, sem inicio ou fim.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleDateRange}
                  aria-pressed={form.useDateRange}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.useDateRange
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.useDateRange ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          )}

          {form.periodType === 'WEEKLY' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dias da semana
              </p>
              <div className="flex flex-wrap gap-2">
                {weekDayOptions.map((day) => {
                  const active = form.weekDays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekDay(day.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se nenhum dia for selecionado, a meta conta todos os dias da semana.
              </p>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Meta
            <input
              type="number"
              min="1"
              step="1"
              value={form.target}
              onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </label>

          {(form.periodType === 'CUSTOM' || form.useDateRange) && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Inicio
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fim
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                {editingId ? 'Atualizar meta' : 'Criar meta'}
              </>
            )}
          </Button>
        </form>

        <div className="space-y-4 xl:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Metas registradas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Acompanhe o periodo atual e o historico fica salvo para relatorios.
              </p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
                <p className="text-gray-600 dark:text-gray-400">Carregando metas...</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center text-gray-600 dark:text-gray-400">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Target size={22} />
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Nenhuma meta criada ainda
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use o formulario ao lado para adicionar a primeira meta automatica.
              </p>
            </div>
          ) : (
            goals.map((goal) => {
              const periodStart = goal.periodStart ?? goal.startDate
              const periodEnd = goal.periodEnd ?? goal.endDate
              const progressValue = typeof goal.progress === 'number' ? goal.progress : 0
              const current = goal.current ?? 0
              const metricLabel =
                metricOptions.find((option) => option.value === goal.metricType)?.label ??
                goal.metricType
              const periodLabel =
                periodOptions.find((option) => option.value === goal.periodType)?.label ??
                goal.periodType
              const isAutomatic =
                !goal.startDate && !goal.endDate && goal.periodType !== 'CUSTOM'
              const displayTitle = goal.title?.trim() || metricLabel
              const weekDaysLabel =
                goal.weekDays && goal.weekDays.length > 0
                  ? weekDayOptions
                    .filter((day) => goal.weekDays.includes(day.value))
                    .map((day) => day.label)
                    .join(', ')
                  : 'Todos os dias'

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {displayTitle}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${isAutomatic
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                            }`}
                        >
                          {isAutomatic ? 'Automatica' : 'Com periodo'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60">
                          {metricLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60">
                          {periodLabel}
                        </span>
                        {goal.periodType === 'WEEKLY' && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60">
                            {weekDaysLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(goal)}
                      >
                        <Pencil size={14} className="mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 size={14} className="mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Progresso: {current}/{goal.target}
                      </span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${Math.min(progressValue, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        Periodo atual:
                      </span>{' '}
                      {formatDate(periodStart)} - {formatDate(periodEnd)}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">Dias:</span>{' '}
                      {goal.periodType === 'WEEKLY' ? weekDaysLabel : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">Status:</span>{' '}
                      {goal.active === false ? 'Inativa' : 'Ativa'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
