'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { OnboardingContent } from '@/components/features/onboarding/OnboardingContent'

const SKIP_PATHS = ['/login', '/register']

/**
 * Instead of redirecting to /onboarding, this gate renders the onboarding
 * wizard as a modal overlay on top of the CRM content.
 * The CRM is visible (blurred) behind the overlay.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { status } = useSession()

  const showGate =
    status === 'authenticated' && !SKIP_PATHS.some((p) => pathname === p)

  return (
    <>
      {children}
      {showGate && <OnboardingContent />}
    </>
  )
}
