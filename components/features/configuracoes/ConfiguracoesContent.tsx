/**
 * Conteúdo das configurações (seções e cards). Reutilizado na página e no drawer.
 */
'use client'

import {
  AssinaturaMercadoPagoCard,
  MenuLayoutCard,
  SidebarBehaviorCard,
  ThemePreferenceCard,
  ConfirmBeforeDeleteCard,
  DateFormatCard,
  ExcluirDadosCard,
  OrcamentoPdfConfigCard,
  PageHeaderPreferenceCard,
  PlataformaEmailCard,
  SuporteCard,
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
          <MenuLayoutCard />
          <SidebarBehaviorCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Interface
        </h2>
        <div className="space-y-2">
          <ConfirmBeforeDeleteCard />
          <DateFormatCard />
          <PageHeaderPreferenceCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Contato
        </h2>
        <div className="space-y-2">
          <PlataformaEmailCard />
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

      {billingSubscriptionEnabled ? (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Dados da conta
          </h2>
          <div className="space-y-2">
            <AssinaturaMercadoPagoCard />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Suporte
        </h2>
        <div className="space-y-2">
          <SuporteCard />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Excluir dados da conta
        </h2>
        <div className="space-y-2">
          <ExcluirDadosCard />
        </div>
      </section>
    </div>
  )
}
