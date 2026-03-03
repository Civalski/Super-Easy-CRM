import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
  href?: string
  hoverRing?: 'none' | 'purple'
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
  href,
  hoverRing = 'none',
}: StatCardProps) {
  const changeColorClass =
    changeType === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : changeType === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400'

  const hoverRingClass =
    hoverRing === 'purple'
      ? 'transition hover:ring-1 hover:ring-purple-200/60 dark:hover:ring-purple-700/35'
      : ''

  const cardContent = (
    <div className={`crm-card p-6 ${hoverRingClass}`}>
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

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl"
        aria-label={`Ir para ${title}`}
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

