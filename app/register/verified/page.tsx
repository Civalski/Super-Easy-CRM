import { Suspense } from 'react'
import { RegisterVerifiedContent } from '@/components/features/register/RegisterVerifiedContent'

export default function RegisterVerifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <RegisterVerifiedContent />
    </Suspense>
  )
}
