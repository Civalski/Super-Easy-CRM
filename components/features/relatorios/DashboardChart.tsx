'use client'

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface ChartData {
  name: string
  [key: string]: string | number
}

export interface DashboardChartProps {
  data: ChartData[]
  chartType: 'linha' | 'pizza'
  metrics: { key: string; label: string }[]
  periodLabel: string
  description: string
}

export interface DashboardChartRef {
  generatePdf: () => Promise<void>
}

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#8b5cf6', '#f59e0b', '#64748b', '#3b82f6', '#ec4899', '#14b8a6', '#eab308']

export const DashboardChart = forwardRef<DashboardChartRef, DashboardChartProps>(
  ({ data, chartType, metrics, periodLabel, description }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      generatePdf: async () => {
        if (!chartRef.current) return

        try {
          const canvas = await html2canvas(chartRef.current, { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          })
          const imgData = canvas.toDataURL('image/png')
          
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
          })

          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
          pdf.save(`Relatorio_${new Date().getTime()}.pdf`)
        } catch (error) {
          console.error('Erro ao gerar PDF', error)
          alert('Erro ao gerar PDF')
        }
      }
    }))

    // Calculate totals for each metric
    const totals = metrics.map(m => {
      const total = data.reduce((acc, curr) => acc + (Number(curr[m.key]) || 0), 0)
      return { ...m, total }
    })

    const pieData = metrics.map(m => {
      const total = data.reduce((acc, curr) => acc + (Number(curr[m.key]) || 0), 0)
      return { name: m.label, total, key: m.key }
    })

    return (
      <div 
        className="absolute left-[-9999px] top-0 pointer-events-none opacity-0 flex flex-col"
        style={{ width: '1024px', height: '768px' }}
      >
        {/* Render for PDF off-screen */}
        <div ref={chartRef} className="bg-white p-8 w-full h-full flex flex-col">
          <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{description || 'Relatório Personalizado'}</h2>
              <p className="text-gray-500">Período: {periodLabel}</p>
            </div>
          </div>

          <div className="flex gap-6 mb-8 mt-2 flex-wrap">
            {totals.map((t, idx) => (
              <div key={t.key} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm min-w-[200px]">
                <p className="text-gray-500 text-sm mb-1">{t.label}</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <p className="text-2xl font-bold text-gray-900">{t.total}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm w-full relative">
            {data.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-2xl">
                Nenhum dado encontrado no período.
              </div>
            ) : chartType === 'linha' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={14} 
                    tickLine={false} 
                    axisLine={false} 
                    angle={-45}
                    textAnchor="end"
                    dy={15}
                  />
                  <YAxis stroke="#6b7280" fontSize={14} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {metrics.map((m, idx) => (
                    <Line 
                      key={m.key}
                      type="monotone" 
                      dataKey={m.key} 
                      name={m.label}
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    label={({ name, percent }) => (percent || 0) > 0 ? `${name} (${((percent || 0) * 100).toFixed(0)}%)` : ''}
                    outerRadius={200}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#000' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '30px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    )
  }
)

DashboardChart.displayName = 'DashboardChart'
