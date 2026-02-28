'use client'

import {
  ConfiguracoesHeader,
  MockDataCard,
  ConfiguracoesEmptyState,
} from '@/components/features/configuracoes'

export default function ConfiguracoesPage() {
  return (
    <div>
      <ConfiguracoesHeader />

      <div className="space-y-6">
        <MockDataCard />
        <ConfiguracoesEmptyState />
      </div>
    </div>
  )
}
