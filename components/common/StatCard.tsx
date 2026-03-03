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

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/30',
  },
  green: {
    gradient: 'from-emerald-500 to-green-400',
    shadow: 'shadow-emerald-500/30',
  },
  yellow: {
    gradient: 'from-amber-500 to-yellow-400',
    shadow: 'shadow-amber-500/30',
  },
  purple: {
    gradient: 'from-violet-500 to-indigo-400',
    shadow: 'shadow-violet-500/30',
  },
  red: {
    gradient: 'from-rose-500 to-red-400',
    shadow: 'shadow-rose-500/30',
  },
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
  const config = colorConfig[color]

  const changeStyle =
    changeType === 'positive'
      ? 'text-emerald-400 bg-emerald-400/10'
      : changeType === 'negative'
      ? 'text-rose-400 bg-rose-400/10'
      : 'text-slate-400 bg-slate-400/10'

  const cardContent = (
    <div
      className={`crm-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 ${
        hoverRing === 'purple' ? 'hover:ring-1 hover:ring-indigo-400/30' : ''
      }`}
    >
      <div className="relative flex items-start justify-between gap-2">
        <div
          className={`rounded-xl bg-gradient-to-br ${config.gradient} p-2.5 shadow-lg ${config.shadow}`}
        >
          <Icon size={18} className="text-white" strokeWidth={2.5} />
        </div>

        {change && (
          <span className={`self-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${changeStyle}`}>
            {change}
          </span>
        )}
      </div>

      <div className="relative mt-4 space-y-0.5">
        <p className="text-[28px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      </div>

      {/* Barra de accent na base do card */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r ${config.gradient} opacity-40 transition-opacity duration-300 group-hover:opacity-90`}
      />
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={`Ir para ${title}`}
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
