'use client'

import {
  ConfiguracoesHeader,
  ConfiguracoesContent,
} from '@/components/features/configuracoes'

export default function ConfiguracoesPage() {
  return (
    <div className="max-w-xl">
      <ConfiguracoesHeader />
      <ConfiguracoesContent />
    </div>
  )
}
