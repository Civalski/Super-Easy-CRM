import Image from 'next/image'
import { ParticlesJsBackground } from '@/components/features/register/ParticlesJsBackground'
import type { LoginThemeAppearance } from '@/components/features/login/types'

type RegisterHeroProps = {
  appearance: LoginThemeAppearance
}

export function RegisterHero({ appearance }: RegisterHeroProps) {
  return (
    <section
      className={`relative flex min-h-[40vh] flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12 ${appearance.heroSection}`}
    >
      <ParticlesJsBackground />

      <div className={`pointer-events-none absolute inset-0 ${appearance.heroPrimaryGlow}`} />
      <div className={`pointer-events-none absolute inset-0 ${appearance.heroSecondaryGlow}`} />

      <div className="relative z-10">
        <Image
          src="/arker10.png"
          alt="Arker CRM"
          width={240}
          height={66}
          className="h-11 w-auto object-contain"
        />
      </div>

      <div className="relative z-10 max-w-xl space-y-4">
        <h1 className={`crm-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl ${appearance.heroTitle}`}>
          Crie sua conta e padronize seu processo comercial.
        </h1>
        <p className={`max-w-lg text-sm sm:text-base ${appearance.heroDescription}`}>
          Cadastre-se em minutos e valide o processo completo com 1 mes premium gratis
          antes da assinatura mensal.
        </p>
      </div>

      <div className="relative z-10 hidden gap-4 text-xs sm:flex">
        <span className={`rounded-full border px-3 py-1 ${appearance.heroChip}`}>Cadastro seguro</span>
        <span className={`rounded-full border px-3 py-1 ${appearance.heroChip}`}>Criptografia moderna</span>
        <span className={`rounded-full border px-3 py-1 ${appearance.heroChip}`}>1 mes premium gratis</span>
      </div>
    </section>
  )
}
