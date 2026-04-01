import { DEFAULT_METRIC_COLORS, REPORT_TEMPLATES } from './constants'
import type { DatePresetKey, MetricaKey, ReportBlockDraft, ReportTemplateKey } from './types'

export function getDefaultYearDateRange() {
  const now = new Date()
  return {
    startDate: `${now.getFullYear()}-01-01`,
    endDate: `${now.getFullYear()}-12-31`,
  }
}

export function getDateRangeFromPreset(preset: DatePresetKey) {
  const end = new Date()
  const start = new Date(end)

  if (preset === '7d') {
    start.setDate(start.getDate() - 6)
  } else if (preset === '30d') {
    start.setDate(start.getDate() - 29)
  } else if (preset === '90d') {
    start.setDate(start.getDate() - 89)
  } else {
    start.setMonth(0, 1)
  }

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  }
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function formatPeriodLabel(startDate: string, endDate: string) {
  const from = startDate.split('-').reverse().join('/')
  const to = endDate.split('-').reverse().join('/')
  return `${from} a ${to}`
}

export function buildDashboardQuery(params: {
  startDate: string
  endDate: string
  metricas: MetricaKey[]
}) {
  const query = new URLSearchParams()
  query.set('data_inicio', params.startDate)
  query.set('data_fim', params.endDate)
  params.metricas.forEach((metrica) => query.append('metricas', metrica))
  return query
}

export function createDefaultReportBlock(index = 1): ReportBlockDraft {
  return {
    id: `block-${Date.now()}-${index}`,
    title: `Bloco ${index}`,
    description: '',
    chartType: 'linha',
    selectedMetrics: ['pedidos'],
    metricColors: { ...DEFAULT_METRIC_COLORS },
  }
}

export function createBlockFromTemplate(templateKey: ReportTemplateKey, index = 1): ReportBlockDraft {
  const template = REPORT_TEMPLATES.find((item) => item.key === templateKey)
  const block = createDefaultReportBlock(index)
  if (!template) return block

  return {
    ...block,
    title: template.label,
    selectedMetrics: [...template.metricas],
  }
}

export function validateDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 'Preencha data de inicio e fim.'

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Periodo informado invalido.'
  }

  if (start.getTime() > end.getTime()) {
    return 'Data inicial nao pode ser maior que a final.'
  }

  return ''
}
