import { Suspense } from 'react'
import { SubscriptionGate } from '@/components/layout/SubscriptionGate'
import { EquipeContent } from '@/components/features/equipe/EquipeContent'

export default function EquipePage() {
  return (
    <Suspense fallback={<EquipeContent />}>
      <SubscriptionGate>
        <EquipeContent />
      </SubscriptionGate>
    </Suspense>
  )
}
