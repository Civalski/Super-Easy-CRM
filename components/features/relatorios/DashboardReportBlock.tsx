'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardPdfBlock, DashboardPdfMetric } from './DashboardChart'

function formatByValueType(value: number, valueType: DashboardPdfMetric['valueType']) {
  if (valueType === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(value)
  }

  return new Intl.NumberFormat('pt-BR').format(value)
}

export function DashboardReportBlock({ block }: { block: DashboardPdfBlock }) {
  const totals = useMemo(
    () =>
      block.metrics.map((metric) => {
        const total = block.data.reduce((acc, curr) => acc + (Number(curr[metric.key]) || 0), 0)
        return { ...metric, total }
      }),
    [block.data, block.metrics]
  )

  const pieData = useMemo(
    () =>
      totals.map((metric) => ({
        name: metric.label,
        key: metric.key,
        total: metric.total,
        color: metric.color,
      })),
    [totals]
  )

  const valueTypeByMetric = useMemo(
    () =>
      block.metrics.reduce<Record<string, DashboardPdfMetric['valueType']>>((acc, metric) => {
        acc[metric.key] = metric.valueType
        return acc
      }, {}),
    [block.metrics]
  )

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <header className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-xl font-semibold text-gray-900">{block.title}</h3>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        {totals.map((metric) => (
          <div key={metric.key} className="min-w-[180px] rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{metric.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: metric.color }} />
              <p className="text-lg font-bold text-gray-900">
                {formatByValueType(metric.total, metric.valueType)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-[320px] rounded-xl border border-gray-200 p-3">
        {block.data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Nenhum dado encontrado para este bloco.
          </div>
        ) : block.chartType === 'pizza' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                label={({ name, percent }) =>
                  (percent || 0) > 0 ? `${name} (${((percent || 0) * 100).toFixed(0)}%)` : ''
                }
                outerRadius={110}
                dataKey="total"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <RechartsTooltip
                formatter={(value, _name, item) => {
                  const key = item.payload?.key || ''
                  const type = valueTypeByMetric[key] || 'count'
                  const numericValue = typeof value === 'number' ? value : Number(value) || 0
                  return [formatByValueType(numericValue, type), item.payload?.name || 'Total']
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : block.chartType === 'barra' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={block.data} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Legend />
              <RechartsTooltip
                formatter={(value, key) => {
                  const type = valueTypeByMetric[String(key)] || 'count'
                  const numericValue = typeof value === 'number' ? value : Number(value) || 0
                  return [formatByValueType(numericValue, type), key]
                }}
              />
              {block.metrics.map((metric) => (
                <Bar key={metric.key} dataKey={metric.key} name={metric.label} fill={metric.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={block.data} margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Legend />
              <RechartsTooltip
                formatter={(value, key) => {
                  const type = valueTypeByMetric[String(key)] || 'count'
                  const numericValue = typeof value === 'number' ? value : Number(value) || 0
                  return [formatByValueType(numericValue, type), key]
                }}
              />
              {block.metrics.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.label}
                  stroke={metric.color}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {block.description.trim() && (
        <p className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
          {block.description}
        </p>
      )}
    </section>
  )
}

