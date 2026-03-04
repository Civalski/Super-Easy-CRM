import Image from 'next/image'
import { ParticlesJsBackground } from '@/components/features/register/ParticlesJsBackground'

export function RegisterHero() {
  return (
    <section className="relative flex min-h-[40vh] flex-col justify-between overflow-hidden border-b border-slate-800/70 bg-linear-to-br from-purple-950 via-slate-950 to-black px-6 py-8 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-14 lg:py-12">
      <ParticlesJsBackground />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.22),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_75%,rgba(124,58,237,0.14),transparent_46%)]" />

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
        <h1 className="crm-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
          Crie sua conta e padronize seu processo comercial.
        </h1>
        <p className="max-w-lg text-sm text-slate-200/85 sm:text-base">
          Ative o CRM com codigo de registro e mantenha clientes, oportunidades, pedidos e tarefas no mesmo fluxo.
        </p>
      </div>

      <div className="relative z-10 hidden gap-4 text-xs text-slate-200/80 sm:flex">
        <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Cadastro seguro</span>
        <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Turnstile ativo</span>
        <span className="rounded-full border border-slate-200/20 bg-slate-900/40 px-3 py-1">Acesso por convite</span>
      </div>
    </section>
  )
}
