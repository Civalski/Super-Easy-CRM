import type { LucideIcon } from 'lucide-react'

export type MetricaKey =
  | 'novos_clientes'
  | 'orcamentos'
  | 'pedidos'
  | 'cancelados'
  | 'oportunidades_fechadas'
  | 'oportunidades_perdidas'
  | 'receita_pedidos'
  | 'receita_fechamentos'
  | 'pedidos_pagos'
  | 'ticket_medio_pedido'

export type ChartType = 'linha' | 'barra' | 'pizza'

export type ReportTemplateKey =
  | 'personalizado'
  | 'executivo_comercial'
  | 'receita_performance'
  | 'risco_cancelamento'

export type DatePresetKey = '7d' | '30d' | '90d' | 'ano_atual'

export interface MetricaOption {
  key: MetricaKey
  label: string
  description: string
  icon: LucideIcon
  valueType: 'count' | 'currency'
}

export interface ReportTemplateOption {
  key: ReportTemplateKey
  label: string
  description: string
  metricas: MetricaKey[]
}

export interface DatePresetOption {
  key: DatePresetKey
  label: string
}

export interface ReportBlockDraft {
  id: string
  title: string
  description: string
  chartType: ChartType
  selectedMetrics: MetricaKey[]
  metricColors: Record<MetricaKey, string>
}
