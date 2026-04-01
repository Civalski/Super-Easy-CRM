'use client'
import { useMemo, useRef, useState } from 'react'
import { METRICAS_OPCIONAIS } from '../constants'
import type { ChartData, DashboardChartRef, DashboardPdfBlock } from '../DashboardChart'
import type { ChartType, MetricaKey, ReportBlockDraft, ReportTemplateKey } from '../types'
import {
  buildDashboardQuery,
  createBlockFromTemplate,
  createDefaultReportBlock,
  formatPeriodLabel,
  getDefaultYearDateRange,
  validateDateRange,
} from '../utils'

export function useRelatoriosPage() {
  const defaultRange = getDefaultYearDateRange()
  const dashboardRef = useRef<DashboardChartRef | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dashboardTitle, setDashboardTitle] = useState('Dashboard de Relatorio')
  const [dashboardDescription, setDashboardDescription] = useState('')
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)
  const [blocks, setBlocks] = useState<ReportBlockDraft[]>([createDefaultReportBlock(1)])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfBlocks, setPdfBlocks] = useState<DashboardPdfBlock[]>([])
  const periodLabel = useMemo(() => formatPeriodLabel(startDate, endDate), [startDate, endDate])
  const applyTemplate = (templateKey: ReportTemplateKey) => {
    if (templateKey === 'personalizado') return
    const current = blocks[0]
    const fromTemplate = createBlockFromTemplate(templateKey, 1)
    setBlocks([
      {
        ...fromTemplate,
        id: current?.id || fromTemplate.id,
        chartType: current?.chartType || 'linha',
        description: current?.description || '',
        metricColors: current?.metricColors || fromTemplate.metricColors,
      },
    ])
    setDashboardTitle(`Dashboard ${fromTemplate.title}`)
  }
  const addBlock = () => setBlocks((prev) => [...prev, createDefaultReportBlock(prev.length + 1)])
  const removeBlock = (blockId: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((block) => block.id !== blockId)
    })
  }
  const updateBlockField = <T extends keyof ReportBlockDraft>(blockId: string, field: T, value: ReportBlockDraft[T]) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, [field]: value } : block))
    )
  }
  const updateBlockChartType = (blockId: string, value: ChartType) => updateBlockField(blockId, 'chartType', value)
  const toggleBlockMetric = (blockId: string, metric: MetricaKey) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block
        const hasMetric = block.selectedMetrics.includes(metric)
        if (hasMetric && block.selectedMetrics.length === 1) return block
        return {
          ...block,
          selectedMetrics: hasMetric
            ? block.selectedMetrics.filter((item) => item !== metric)
            : [...block.selectedMetrics, metric],
        }
      })
    )
  }
  const setMetricColor = (blockId: string, metric: MetricaKey, color: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              metricColors: {
                ...block.metricColors,
                [metric]: color,
              },
            }
          : block
      )
    )
  }
  const buildPdfBlock = async (block: ReportBlockDraft) => {
    const query = buildDashboardQuery({ startDate, endDate, metricas: block.selectedMetrics })
    const response = await fetch(`/api/relatorios/dashboard?${query.toString()}`)
    if (!response.ok) throw new Error('Falha ao carregar dados do bloco')
    const data = (await response.json()) as ChartData[]
    return {
      id: block.id,
      title: block.title.trim() || `Bloco ${blocks.findIndex((item) => item.id === block.id) + 1}`,
      description: block.description,
      chartType: block.chartType,
      data,
      metrics: block.selectedMetrics.map((metricKey) => {
        const metricInfo = METRICAS_OPCIONAIS.find((item) => item.key === metricKey)
        return {
          key: metricKey,
          label: metricInfo?.label || metricKey,
          valueType: metricInfo?.valueType || 'count',
          color: block.metricColors[metricKey] || '#3b82f6',
        }
      }),
    } satisfies DashboardPdfBlock
  }
  const handleFetchAndGenerate = async () => {
    const dateError = validateDateRange(startDate, endDate)
    if (dateError) return setError(dateError)
    if (!blocks.length) return setError('Adicione ao menos um bloco para gerar o dashboard.')
    const invalidBlock = blocks.find((block) => block.selectedMetrics.length === 0)
    if (invalidBlock) return setError('Cada bloco precisa ter pelo menos uma metrica selecionada.')
    setLoading(true)
    setError('')
    try {
      const preparedBlocks = await Promise.all(blocks.map((block) => buildPdfBlock(block)))
      setPdfBlocks(preparedBlocks)
      setTimeout(() => {
        if (!dashboardRef.current) {
          setLoading(false)
          setError('Erro ao preparar a exportacao do arquivo.')
          return
        }
        dashboardRef.current.generatePdf().finally(() => {
          setLoading(false)
          setDrawerOpen(false)
        })
      }, 500)
    } catch (fetchError) {
      console.error(fetchError)
      setError('Nao foi possivel gerar o PDF com os blocos atuais.')
      setLoading(false)
    }
  }
  return {
    dashboardRef,
    drawerOpen,
    setDrawerOpen,
    dashboardTitle,
    setDashboardTitle,
    dashboardDescription,
    setDashboardDescription,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    periodLabel,
    blocks,
    addBlock,
    removeBlock,
    updateBlockField,
    updateBlockChartType,
    toggleBlockMetric,
    setMetricColor,
    applyTemplate,
    loading,
    error,
    handleFetchAndGenerate,
    pdfBlocks,
  }
}
