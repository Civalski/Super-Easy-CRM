import { redirect } from 'next/navigation'
import { getPostLoginPath } from '@/lib/crmEdition'

/**
 * The onboarding wizard is now shown as an overlay on top of the CRM.
 * This page redirects para a home da edição (dashboard completo ou funil na OSS).
 */
export default function OnboardingPage() {
  redirect(getPostLoginPath())
}
