import Image from 'next/image'
import { LOGIN_HIGHLIGHT_CHIPS } from './constants'
import { LoginTypewriterHeadline } from './LoginTypewriterHeadline'
import { ParticlesJsBackground } from './ParticlesJsBackground'
import type { LoginThemeAppearance } from './types'
import type { AppTheme } from '@/lib/ui/themePreference'

type LoginHeroProps = {
  appearance: LoginThemeAppearance
  theme: AppTheme
}

export function LoginHero({ appearance }: LoginHeroProps) {
  return (
    <section
      className={`relative flex min-h-[40vh] flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12 ${appearance.heroSection}`}
    >
      <ParticlesJsBackground />

      <div className={`pointer-events-none absolute inset-0 ${appearance.heroPrimaryGlow}`} />
      <div className={`pointer-events-none absolute inset-0 ${appearance.heroSecondaryGlow}`} />

      <div className="relative z-10">
        <Image
          src="/arkerlogo1.png"
          alt="Arkersoft"
          width={210}
          height={58}
          className="h-9 w-auto object-contain"
        />
      </div>

      <div className="relative z-10 max-w-2xl space-y-4">
        <LoginTypewriterHeadline appearance={appearance} />
        <p className={`max-w-lg text-sm sm:text-base ${appearance.heroDescription}`}>
          Visualize prioridades, padronize o processo comercial, gerencie pedidos, produtos e
          tarefas, e monitore cada etapa.
        </p>
      </div>

      <div className="relative z-10 hidden gap-4 text-xs sm:flex">
        {LOGIN_HIGHLIGHT_CHIPS.map((chip) => (
          <span
            key={chip}
            className={`rounded-full border px-3 py-1 ${appearance.heroChip}`}
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  )
}
