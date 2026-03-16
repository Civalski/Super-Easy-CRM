'use client'

import { Button } from '@/components/common'
import { REGISTER_PLANS } from '@/components/features/register/constants'
import type { RegisterFormValues } from '@/components/features/register/types'
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from '@/lib/icons'

type RegisterCheckoutStepProps = {
  checkoutOpen: boolean
  form: RegisterFormValues
  onOpenCheckout: () => void
}

const CHECKOUT_ITEMS = [
  'Sua conta foi criada e os dados do cadastro ja foram salvos.',
  'O pagamento e feito no Stripe em um painel lateral seguro, sem sair desta pagina.',
  'Assim que a assinatura for confirmada, o acesso ao CRM sera liberado.',
] as const

export function RegisterCheckoutStep({
  checkoutOpen,
  form,
  onOpenCheckout,
}: RegisterCheckoutStepProps) {
  const selectedPlan = REGISTER_PLANS.find((plan) => plan.id === form.planId)
  const userCount = selectedPlan?.licenses ?? 1

  return (
    <section className="relative flex items-center justify-center bg-slate-950 px-2 py-6 sm:px-6 lg:px-10">
      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-slate-600/70 bg-slate-800/65 p-5 shadow-[0_30px_60px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <CheckCircle2 size={14} />
              Cadastro finalizado
            </div>

            <div className="space-y-2">
              <h2 className="crm-display text-3xl font-semibold text-white">
                Falta so confirmar o pagamento
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Abrimos o checkout do Stripe em um menu lateral para voce concluir a
                assinatura sem perder o contexto do cadastro.
              </p>
            </div>

            <div className="space-y-3">
              {CHECKOUT_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <ShieldCheck size={18} className="mt-0.5 text-emerald-300" />
                  <p className="text-sm text-slate-200">{item}</p>
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={onOpenCheckout}
              className="h-11 gap-2 rounded-xl px-5 text-sm font-semibold"
            >
              {checkoutOpen ? 'Checkout aberto no menu lateral' : 'Abrir checkout Stripe'}
              <ArrowRight size={16} />
            </Button>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <CreditCard size={16} />
              Resumo do cadastro
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plano</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {selectedPlan?.name ?? 'Individual'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {userCount} {userCount === 1 ? 'usuario' : 'usuarios'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Responsavel</p>
                <p className="mt-1 font-medium text-white">{form.name}</p>
                <p className="mt-1 text-xs text-slate-400">{form.email}</p>
                <p className="mt-1 text-xs text-slate-400">{form.phone}</p>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                Se voce fechar o painel lateral, pode abrir novamente por aqui e continuar de
                onde parou.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
