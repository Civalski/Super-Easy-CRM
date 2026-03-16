import { Suspense } from 'react'
import { ConfirmEmailStatus } from '@/components/features/register/ConfirmEmailStatus'

export default function RegisterCheckEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ConfirmEmailStatus />
    </Suspense>
  )
}
