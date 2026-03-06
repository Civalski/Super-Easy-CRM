'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, SideCreateDrawer } from '@/components/common'
import {
  Loader2, Plus, Trash2, Pencil, Target, TrendingUp,
  CheckCircle2, Clock, BarChart3, Phone, Save, X as XIcon,
  AlertTriangle, Flame, ChevronDown, ChevronUp,
} from '@/lib/icons'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/components/common'

type GoalMetricType =
  | 'CLIENTES_CONTATADOS'
  | 'PROPOSTAS'
  | 'CLIENTES_CADASTRADOS'
  | 'VENDAS'
  | 'QUALIFICACAO'
  | 'PROSPECCAO'
  | 'FATURAMENTO'

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

interface DebitDay {
  data: string
  meta: number
  feitos: number
  faltam: number
}

interface MetaContatoData {
  configurada?: boolean
  ativo: boolean
  metaDiaria: number | null
  contatosHoje: number
  progressoHoje: number
  debito: DebitDay[]
  debitoTotal: number
  hoje?: string
}

const metricOptions: Array<{ value: GoalMetricType; label: string }> = [
  { value: 'CLIENTES_CONTATADOS', label: 'Clientes contatados' },
  { value: 'PROPOSTAS', label: 'Orçamentos' },
  { value: 'CLIENTES_CADASTRADOS', label: 'Clientes cadastrados' },
  { value: 'VENDAS', label: 'Vendas (qtd. fechadas)' },
  { value: 'FATURAMENTO', label: 'Faturamento (R$)' },
  { value: 'QUALIFICACAO', label: 'Em potencial' },
  { value: 'PROSPECCAO', label: 'Sem contato' },
]

const periodOptions: Array<{ value: GoalPeriodType; label: string }> = [
  { value: 'DAILY', label: 'Diária' },
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
  { value: 6, label: 'Sáb' },
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

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getProgressColor(value: number, completed: boolean) {
  if (completed) return 'from-emerald-500 to-green-400'
  if (value >= 75) return 'from-blue-500 to-indigo-400'
  if (value >= 40) return 'from-amber-500 to-yellow-400'
  return 'from-red-500 to-rose-400'
}

function getProgressBg(value: number, completed: boolean) {
  if (completed) return 'text-emerald-600 dark:text-emerald-400'
  if (value >= 75) return 'text-blue-600 dark:text-blue-400'
  if (value >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export default function MetasPage() {
  const { confirm, prompt } = useConfirm()
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
  const [showForm, setShowForm] = useState(false)

  // Meta Diária de Contatos state
  const [metaData, setMetaData] = useState<MetaContatoData | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editMetaValue, setEditMetaValue] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)
  const [showDebt, setShowDebt] = useState(false)

  const handleUnauthorized = useCallback(() => {
    setError('Sua sessão expirou. Entre novamente para continuar.')
    router.push('/login')
  }, [router])

  const fetchGoals = useCallback(async () => {
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
        setGoals([])
      }
    } catch (err) {
      console.error('Erro ao buscar metas:', err)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized])

  const fetchMetaDiaria = useCallback(async () => {
    try {
      const response = await fetch('/api/metas/contatos-diarios')
      if (response.ok) {
        const result = await response.json()
        setMetaData(result)
        if (typeof result.metaDiaria === 'number' && Number.isFinite(result.metaDiaria)) {
          setEditMetaValue(String(result.metaDiaria))
        } else {
          setEditMetaValue('')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar meta de contatos:', error)
    } finally {
      setMetaLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
    fetchMetaDiaria()
  }, [fetchGoals, fetchMetaDiaria])

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
    setShowForm(false)
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
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (goalId: string) => {
    const ok = await confirm({
      title: 'Excluir meta?',
      description: 'Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })
    if (!ok) return

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
        toast.error('Erro ao excluir', { description: data.error || 'Erro ao excluir meta' })
      }
    } catch (err) {
      console.error('Erro ao excluir meta:', err)
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

  // Meta diária handlers
  const handleSaveMeta = async () => {
    const newValue = parseInt(editMetaValue)
    if (!newValue || newValue < 1) {
      toast.error('Valor inválido', { description: 'A meta deve ser um número maior que zero.' })
      return
    }

    setSavingMeta(true)
    try {
      const response = await fetch('/api/metas/contatos-diarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'atualizar_meta', metaDiaria: newValue }),
      })
      if (response.ok) {
        setEditingMeta(false)
        await fetchMetaDiaria()
        toast.success(`Meta atualizada para ${newValue} contatos/dia`)
      }
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
    } finally {
      setSavingMeta(false)
    }
  }

  const handleDismissDay = async (dateStr: string) => {
    const ok = await confirm({
      title: 'Esquecer meta deste dia?',
      description: `A meta do dia ${formatDateShort(dateStr)} será ignorada.`,
      confirmLabel: 'Sim, esquecer',
      cancelLabel: 'Cancelar',
    })
    if (ok) {
      try {
        await fetch('/api/metas/contatos-diarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'esquecer', data: dateStr }),
        })
        await fetchMetaDiaria()
      } catch (error) {
        console.error('Erro ao esquecer meta:', error)
      }
    }
  }

  const handleDismissAll = async () => {
    const ok = await confirm({
      title: 'Esquecer todas as metas pendentes?',
      description: 'Todas as metas acumuladas dos dias anteriores serão ignoradas.',
      confirmLabel: 'Sim, esquecer tudo',
      cancelLabel: 'Cancelar',
      confirmVariant: 'danger',
    })
    if (ok) {
      try {
        await fetch('/api/metas/contatos-diarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'esquecer_todos' }),
        })
        await fetchMetaDiaria()
      } catch (error) {
        console.error('Erro ao esquecer metas:', error)
      }
    }
  }

  const handleCreateMetaDiaria = async () => {
    const value = await prompt({
      title: 'Criar meta diária de contatos',
      label: 'Meta diária',
      placeholder: 'Ex: 25',
      defaultValue: '25',
      confirmLabel: 'Criar',
      cancelLabel: 'Cancelar',
    })

    if (!value) return

    const numericValue = Number(value)
    if (!Number.isInteger(numericValue) || numericValue < 1) {
      toast.error('Valor inválido', { description: 'Informe um número inteiro maior que zero.' })
      return
    }

    try {
      const response = await fetch('/api/metas/contatos-diarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'atualizar_meta', metaDiaria: numericValue }),
      })

      if (response.ok) {
        await fetchMetaDiaria()
      }
    } catch (error) {
      console.error('Erro ao criar meta diária:', error)
    }
  }

  const activeGoals = goals.filter((goal) => goal.active !== false)
  const completedGoals = activeGoals.filter((goal) => (goal.progress ?? 0) >= 100)
  const averageProgress = activeGoals.length
    ? Math.round(
      activeGoals.reduce((sum, goal) => sum + (goal.progress ?? 0), 0) /
      activeGoals.length
    )
    : 0

  // Include meta diária in total count if active
  const hasMetaDiariaAtiva = Boolean(metaData?.ativo && typeof metaData.metaDiaria === 'number')
  const totalMetasCount = activeGoals.length + (hasMetaDiariaAtiva ? 1 : 0)
  const metaDiariaProgress = hasMetaDiariaAtiva ? metaData!.progressoHoje : 0
  const metaDiariaCompleted = hasMetaDiariaAtiva
    ? metaData!.contatosHoje >= (metaData!.metaDiaria as number)
    : false

  const allGoalsForAvg = [
    ...activeGoals.map(g => g.progress ?? 0),
    ...(hasMetaDiariaAtiva ? [metaDiariaProgress] : []),
  ]
  const overallAvg = allGoalsForAvg.length
    ? Math.round(allGoalsForAvg.reduce((a, b) => a + b, 0) / allGoalsForAvg.length)
    : 0
  const totalCompleted = completedGoals.length + (metaDiariaCompleted ? 1 : 0)

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metas e Objetivos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Defina e acompanhe suas metas de desempenho
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!metaLoading && !metaData?.configurada && (
            <button
              onClick={handleCreateMetaDiaria}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 shadow-xs text-sm font-semibold text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors"
            >
              <Phone size={16} />
              Criar meta diária
            </button>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs text-sm font-semibold text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
          >
            <Plus size={16} />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Ativas</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMetasCount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">metas em andamento</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Concluídas</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">no período atual</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Em Progresso</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {totalMetasCount - totalCompleted}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">aguardando conclusão</p>
        </div>

        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progresso Geral</span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallAvg}%</p>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-linear-to-r from-purple-500 to-indigo-500 transition-all"
              style={{ width: `${Math.min(overallAvg, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form (collapses) */}
      {showForm && (
        <SideCreateDrawer open={showForm} onClose={resetForm} maxWidthClass="max-w-4xl">
        <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="crm-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XIcon size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {error && (
              <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título (opcional)
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {metricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Período
              <select
                value={form.periodType}
                onChange={(event) => handlePeriodTypeChange(event.target.value as GoalPeriodType)}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {form.metricType === 'FATURAMENTO' ? 'Meta de Faturamento (R$)' : 'Meta (quantidade)'}
              <input
                type="number"
                min="1"
                step={form.metricType === 'FATURAMENTO' ? '0.01' : '1'}
                value={form.target}
                onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={form.metricType === 'FATURAMENTO' ? 'Ex: 50000' : 'Ex: 10'}
                required
              />
            </label>

            {form.periodType === 'WEEKLY' && (
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dias da semana</p>
                <div className="flex flex-wrap gap-2">
                  {weekDayOptions.map((day) => {
                    const active = form.weekDays.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekDay(day.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                          }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {form.periodType !== 'CUSTOM' && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Limitar por datas</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Desmarcado = meta automática contínua</p>
                </div>
                <button
                  type="button"
                  onClick={toggleDateRange}
                  aria-pressed={form.useDateRange}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${form.useDateRange ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.useDateRange ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )}

            {(form.periodType === 'CUSTOM' || form.useDateRange) && (
              <div className="grid grid-cols-2 gap-3 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Início
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fim
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </label>
              </div>
            )}

            <div className="lg:col-span-3 flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancelar
              </button>
              <Button type="submit" disabled={submitting} className="min-w-[160px]">
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus size={14} className="mr-2" />
                    {editingId ? 'Atualizar meta' : 'Criar meta'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        </div>
        </SideCreateDrawer>
      )}

      {/* Metas Registradas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Metas Registradas</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {totalMetasCount} {totalMetasCount === 1 ? 'meta' : 'metas'}
          </span>
        </div>

        {loading || metaLoading ? (
          <div className="flex items-center justify-center min-h-[200px] crm-card">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-3 text-emerald-500" size={28} />
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando metas...</p>
            </div>
          </div>
        ) : totalMetasCount === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Nenhuma meta criada ainda</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              Comece clicando em &quot;Nova Meta&quot; para definir seus objetivos.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300 dark:border-purple-600 shadow-xs text-sm font-semibold text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
            >
              <Plus size={15} />
              Criar primeira meta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Meta Diária de Contatos — sempre primeiro se ativa */}
            {hasMetaDiariaAtiva && (
              <MetaDiariaCard
                metaData={{
                  ...metaData!,
                  metaDiaria: metaData!.metaDiaria as number,
                }}
                editing={editingMeta}
                editValue={editMetaValue}
                saving={savingMeta}
                showDebt={showDebt}
                onEditStart={() => setEditingMeta(true)}
                onEditCancel={() => {
                  setEditingMeta(false)
                  setEditMetaValue(String(metaData?.metaDiaria ?? ''))
                }}
                onEditValueChange={setEditMetaValue}
                onSave={handleSaveMeta}
                onToggleDebt={() => setShowDebt(!showDebt)}
                onDismissDay={handleDismissDay}
                onDismissAll={handleDismissAll}
              />
            )}

            {/* Demais metas */}
            {goals.map((goal) => {
              const progressValue = typeof goal.progress === 'number' ? goal.progress : 0
              const current = goal.current ?? 0
              const isCompleted = progressValue >= 100
              const metricLabel =
                metricOptions.find((option) => option.value === goal.metricType)?.label ??
                goal.metricType
              const periodLabel =
                periodOptions.find((option) => option.value === goal.periodType)?.label ??
                goal.periodType
              const isAutomatic =
                !goal.startDate && !goal.endDate && goal.periodType !== 'CUSTOM'
              const displayTitle = goal.title?.trim() || metricLabel
              const periodStart = goal.periodStart ?? goal.startDate
              const periodEnd = goal.periodEnd ?? goal.endDate
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
                  className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {displayTitle}
                        </h3>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${isAutomatic
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                          }`}>
                          {isAutomatic ? 'Automática' : 'Com período'}
                        </span>
                        {isCompleted && (
                          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            ✓ Concluída
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400">
                          {metricLabel}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400">
                          {periodLabel}
                        </span>
                        {goal.periodType === 'WEEKLY' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400">
                            {weekDaysLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {goal.metricType === 'FATURAMENTO'
                          ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(current)} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target)}`
                          : `${current} de ${goal.target} concluídos`
                        }
                      </span>
                      <span className={`font-semibold ${getProgressBg(progressValue, isCompleted)}`}>
                        {progressValue}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full bg-linear-to-r transition-all ${getProgressColor(progressValue, isCompleted)}`}
                        style={{ width: `${Math.min(progressValue, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {(periodStart || periodEnd) && (
                      <span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Período:</span>{' '}
                        {formatDate(periodStart)} — {formatDate(periodEnd)}
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>{' '}
                      {goal.active === false ? 'Inativa' : 'Ativa'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Meta Diária de Contatos Card ──────────────────────────────────────────────

interface MetaDiariaCardProps {
  metaData: MetaContatoData & { metaDiaria: number }
  editing: boolean
  editValue: string
  saving: boolean
  showDebt: boolean
  onEditStart: () => void
  onEditCancel: () => void
  onEditValueChange: (v: string) => void
  onSave: () => void
  onToggleDebt: () => void
  onDismissDay: (date: string) => void
  onDismissAll: () => void
}

function MetaDiariaCard({
  metaData,
  editing,
  editValue,
  saving,
  showDebt,
  onEditStart,
  onEditCancel,
  onEditValueChange,
  onSave,
  onToggleDebt,
  onDismissDay,
  onDismissAll,
}: MetaDiariaCardProps) {
  const { metaDiaria, contatosHoje, progressoHoje, debito, debitoTotal } = metaData
  const metaBatida = contatosHoje >= metaDiaria
  const hasDebt = debito.length > 0

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${metaBatida ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-purple-50 dark:bg-purple-500/10'}`}>
            {metaBatida
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              : <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            }
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Meta Diária de Contatos</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                Automática
              </span>
              {metaBatida && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  ✓ Concluída
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Contatos via &quot;Iniciar Contato&quot; na aba Leads
            </p>
          </div>
        </div>

        {/* Edit target */}
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                className="w-16 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave()
                  if (e.key === 'Escape') onEditCancel()
                }}
              />
              <button onClick={onSave} disabled={saving}
                className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
              </button>
              <button onClick={onEditCancel}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className={`text-xl font-bold ${metaBatida ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                  {contatosHoje}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">/{metaDiaria}</span>
              </div>
              <button onClick={onEditStart}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                title="Editar meta diária"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {contatosHoje < metaDiaria
              ? `Faltam ${metaDiaria - contatosHoje} contatos`
              : `🎉 ${contatosHoje - metaDiaria} a mais que a meta!`
            }
          </span>
          <span className={`font-semibold ${metaBatida ? 'text-emerald-600 dark:text-emerald-400' : progressoHoje >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            {progressoHoje}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${metaBatida ? 'bg-linear-to-r from-emerald-500 to-green-400' : progressoHoje >= 60 ? 'bg-linear-to-r from-amber-500 to-yellow-400' : 'bg-linear-to-r from-red-500 to-rose-400'}`}
            style={{ width: `${Math.min(100, progressoHoje)}%` }}
          />
        </div>
      </div>

      {/* Debt row */}
      {hasDebt && (
        <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 overflow-hidden">
          <button
            onClick={onToggleDebt}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {debitoTotal} contatos pendentes de {debito.length} dia{debito.length > 1 ? 's' : ''} anteriores
              </span>
            </div>
            {showDebt
              ? <ChevronUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              : <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            }
          </button>

          {showDebt && (
            <div className="px-4 pb-3 space-y-2">
              {debito.map((day) => (
                <div
                  key={day.data}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800/40"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {formatDateShort(day.data)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({day.feitos}/{day.meta})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      -{day.faltam}
                    </span>
                    <button
                      onClick={() => onDismissDay(day.data)}
                      className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Esquecer
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={onDismissAll}
                className="w-full text-xs py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors font-semibold"
              >
                Esquecer todas as pendências
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
