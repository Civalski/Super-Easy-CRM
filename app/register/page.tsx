import { Suspense } from 'react'
import { RegisterPageContent } from '@/components/features/register/RegisterPageContent'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <RegisterPageContent />
    </Suspense>
  )
}
