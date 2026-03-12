import { redirect } from 'next/navigation'

/**
 * The onboarding wizard is now shown as an overlay on top of the CRM.
 * This page simply redirects to /dashboard where the overlay will appear.
 */
export default function OnboardingPage() {
  redirect('/dashboard')
}
