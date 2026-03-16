'use client'

import { Moon, Sun } from '@/lib/icons'
import { useThemePreference } from '@/lib/hooks/useThemePreference'

export function LoginThemeToggle() {
  const { theme, updateTheme, isLightTheme } = useThemePreference()

  const options = [
    {
      id: 'dark' as const,
      label: 'Escuro',
      icon: Moon,
    },
    {
      id: 'light' as const,
      label: 'Claro',
      icon: Sun,
    },
  ]

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border p-1 backdrop-blur-xl transition-colors ${
        isLightTheme
          ? 'border-slate-200/80 bg-white/80 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.28)]'
          : 'border-white/10 bg-white/5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)]'
      }`}
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.id

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => updateTheme(option.id)}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition ${
              isActive
                ? isLightTheme
                  ? 'border border-slate-200 bg-white text-slate-950 shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isLightTheme
                  ? 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
            aria-pressed={isActive}
          >
            <Icon size={16} className="shrink-0" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
