/**
 * Conteudo das configuracoes (secoes e cards). Reutilizado na pagina e no drawer.
 */
'use client'

import {
  AcessoContaCard,
  ApresentacaoGuiadaCard,
  AssinaturaStripeCard,
  ConfirmBeforeDeleteCard,
  DateFormatCard,
  ExcluirContaCard,
  ExcluirDadosCard,
  ExportarDadosCard,
  ImportarDadosCard,
  MenuLayoutCard,
  OrcamentoPdfConfigCard,
  PageHeaderPreferenceCard,
  PlataformaEmailCard,
  PrivacidadeCard,
  RefazerOnboardingCard,
  SidebarBehaviorCard,
  SuporteCard,
  ThemePreferenceCard,
} from '@/components/features/configuracoes'

export function ConfiguracoesContent() {
  const billingEnabled =
    process.env.NEXT_PUBLIC_BILLING_SUBSCRIPTION_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_BILLING_SUBSCRIPTION_ENABLED === '1'

  return (
    <div className="space-y-4">
      {billingEnabled && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Assinatura
          </h2>
          <div className="space-y-2">
            <AssinaturaStripeCard />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Aparencia
        </h2>
        <div className="space-y-2">
          <ThemePreferenceCard />
          <MenuLayoutCard />
          <SidebarBehaviorCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Configuracao inicial
        </h2>
        <div className="space-y-2">
          <ApresentacaoGuiadaCard />
          <RefazerOnboardingCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Interface
        </h2>
        <div className="space-y-2">
          <ConfirmBeforeDeleteCard />
          <DateFormatCard />
          <PageHeaderPreferenceCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Contato
        </h2>
        <div className="space-y-2">
          <PlataformaEmailCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Orcamentos
        </h2>
        <div className="space-y-2">
          <OrcamentoPdfConfigCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Suporte
        </h2>
        <div className="space-y-2">
          <SuporteCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Backup e exportacao
        </h2>
        <div className="space-y-2">
          <ExportarDadosCard />
          <ImportarDadosCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Privacidade
        </h2>
        <div className="space-y-2">
          <PrivacidadeCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Alterar senha
        </h2>
        <div className="space-y-2">
          <AcessoContaCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Excluir dados da conta
        </h2>
        <div className="space-y-2">
          <ExcluirDadosCard />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Excluir conta
        </h2>
        <div className="space-y-2">
          <ExcluirContaCard />
        </div>
      </section>
    </div>
  )
}
