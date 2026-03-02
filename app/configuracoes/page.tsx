'use client'

import {
  ConfiguracoesHeader,
  SidebarBehaviorCard,
  ThemePreferenceCard,
  ListDensityCard,
  ConfirmBeforeDeleteCard,
  DateFormatCard,
} from '@/components/features/configuracoes'

export default function ConfiguracoesPage() {
  return (
    <div>
      <ConfiguracoesHeader />

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Aparência
          </h2>
          <div className="space-y-6">
            <ThemePreferenceCard />
            <SidebarBehaviorCard />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Interface
          </h2>
          <div className="space-y-6">
            <ListDensityCard />
            <ConfirmBeforeDeleteCard />
            <DateFormatCard />
          </div>
        </section>
      </div>
    </div>
  )
}
