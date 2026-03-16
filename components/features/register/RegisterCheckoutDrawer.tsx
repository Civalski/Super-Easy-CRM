'use client'

import { SideCreateDrawer } from '@/components/common'
import { RegisterEmbeddedCheckout } from '@/components/features/register/RegisterEmbeddedCheckout'
import { REGISTER_PLANS } from '@/components/features/register/constants'
import type { RegisterPlanId } from '@/components/features/register/types'
import { CreditCard, ShieldCheck, X } from '@/lib/icons'

type RegisterCheckoutDrawerProps = {
  open: boolean
  clientSecret: string
  planId: RegisterPlanId
  onClose: () => void
}

export function RegisterCheckoutDrawer({
  open,
  clientSecret,
  planId,
  onClose,
}: RegisterCheckoutDrawerProps) {
  const selectedPlan = REGISTER_PLANS.find((plan) => plan.id === planId)

  return (
    <SideCreateDrawer open={open} onClose={onClose} maxWidthClass="max-w-[1080px]">
      <div className="flex h-full flex-col bg-slate-950 text-slate-100">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <ShieldCheck size={14} />
              Cadastro concluido
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Finalize seu pagamento no Stripe
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-300">
                Plano {selectedPlan?.name ?? 'selecionado'} pronto. Agora falta confirmar o
                cartao no checkout seguro em um layout mais compacto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300 sm:px-6">
          <CreditCard size={14} />
          O acesso ao CRM e liberado automaticamente assim que o Stripe confirmar a assinatura.
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]">
            <div className="rounded-[26px] border border-slate-800 bg-white p-2 shadow-2xl shadow-slate-950/30">
              <RegisterEmbeddedCheckout clientSecret={clientSecret} variant="compact" />
            </div>

            <div className="grid gap-3 content-start">
              <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Plano</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {selectedPlan?.name ?? 'Selecao atual'}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedPlan?.description ?? 'Assinatura pronta para ativacao imediata.'}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Checkout</p>
                <p className="mt-2 text-sm font-medium text-white">Painel mais limpo</p>
                <p className="mt-1 text-sm text-slate-300">
                  O Stripe ganhou mais largura util e menos blocos altos ao redor.
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Se voce fechar o painel lateral, pode abrir novamente por aqui e continuar de
                onde parou.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SideCreateDrawer>
  )
}
