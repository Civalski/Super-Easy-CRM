import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
  red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'blue',
}: StatCardProps) {
  const changeColorClass =
    changeType === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : changeType === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {change && (
          <span className={`text-sm font-medium ${changeColorClass}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

