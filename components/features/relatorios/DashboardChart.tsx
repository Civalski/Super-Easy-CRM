'use client'

import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { ChartType } from './types'
import { DashboardReportBlock } from './DashboardReportBlock'

export interface ChartData {
  name: string
  [key: string]: string | number
}

export interface DashboardPdfMetric {
  key: string
  label: string
  valueType: 'count' | 'currency'
  color: string
}

export interface DashboardPdfBlock {
  id: string
  title: string
  description: string
  chartType: ChartType
  metrics: DashboardPdfMetric[]
  data: ChartData[]
}

export interface DashboardChartProps {
  dashboardTitle: string
  dashboardDescription: string
  periodLabel: string
  blocks: DashboardPdfBlock[]
}

export interface DashboardChartRef {
  generatePdf: () => Promise<void>
}

export const DashboardChart = forwardRef<DashboardChartRef, DashboardChartProps>(
  ({ dashboardTitle, dashboardDescription, periodLabel, blocks }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        if (!chartRef.current) return

        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          })

          const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const margin = 16
          const contentWidth = pageWidth - margin * 2
          const scaledTotalHeight = (canvas.height * contentWidth) / canvas.width
          let remainingHeight = scaledTotalHeight
          let yOffset = 0
          const imgData = canvas.toDataURL('image/png')

          pdf.addImage(imgData, 'PNG', margin, yOffset + margin, contentWidth, scaledTotalHeight)
          remainingHeight -= pageHeight - margin * 2

          while (remainingHeight > 0) {
            yOffset -= pageHeight - margin * 2
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', margin, yOffset + margin, contentWidth, scaledTotalHeight)
            remainingHeight -= pageHeight - margin * 2
          }

          pdf.save(`dashboard_relatorio_${Date.now()}.pdf`)
        } catch (error) {
          console.error('Erro ao gerar PDF', error)
          alert('Erro ao gerar PDF')
        }
      },
    }))

    return (
      <div className="pointer-events-none absolute left-[-9999px] top-0 opacity-0">
        <div ref={chartRef} className="w-[1080px] space-y-4 bg-white p-8">
          <header className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-3xl font-bold text-gray-900">{dashboardTitle || 'Dashboard de Relatorio'}</h2>
            <p className="mt-1 text-sm text-gray-500">Periodo: {periodLabel}</p>
            {dashboardDescription.trim() && (
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{dashboardDescription}</p>
            )}
          </header>

          {blocks.map((block) => (
            <DashboardReportBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    )
  }
)

DashboardChart.displayName = 'DashboardChart'
