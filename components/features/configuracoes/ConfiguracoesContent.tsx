/**
 * Conteúdo das configurações (seções e cards). Reutilizado na página e no drawer.
 */
'use client'

import {
  AssinaturaMercadoPagoCard,
  SidebarBehaviorCard,
  ThemePreferenceCard,
  ListDensityCard,
  ConfirmBeforeDeleteCard,
  DateFormatCard,
  ExcluirDadosCard,
  OrcamentoPdfConfigCard,
} from '@/components/features/configuracoes'
import { isBillingSubscriptionEnabledClient } from '@/lib/billing/feature-toggle'

export function ConfiguracoesContent() {
  const billingSubscriptionEnabled = isBillingSubscriptionEnabledClient()

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Aparência
        </h2>
        <div className="space-y-2">
          <ThemePreferenceCard />
          <SidebarBehaviorCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Interface
        </h2>
        <div className="space-y-2">
          <ListDensityCard />
          <ConfirmBeforeDeleteCard />
          <DateFormatCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Orçamentos
        </h2>
        <div className="space-y-2">
          <OrcamentoPdfConfigCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Dados da conta
        </h2>
        <div className="space-y-2">
          {billingSubscriptionEnabled ? <AssinaturaMercadoPagoCard /> : null}
          <ExcluirDadosCard />
        </div>
      </section>
    </div>
  )
}
