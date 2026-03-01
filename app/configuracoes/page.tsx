'use client'

import {
  ConfiguracoesHeader,
  MockDataCard,
  SidebarBehaviorCard,
  ThemePreferenceCard,
  ConfiguracoesEmptyState,
} from '@/components/features/configuracoes'

export default function ConfiguracoesPage() {
  return (
    <div>
      <ConfiguracoesHeader />

      <div className="space-y-6">
        <ThemePreferenceCard />
        <SidebarBehaviorCard />
        <MockDataCard />
        <ConfiguracoesEmptyState />
      </div>
    </div>
  )
}
