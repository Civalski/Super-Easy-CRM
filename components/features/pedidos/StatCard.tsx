import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  title: string
  value: string
}

export function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <div className="crm-card p-4">
      <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
