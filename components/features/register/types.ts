import type { PlanCardTheme } from '@/components/common/planCardThemes'
import type { LucideIcon } from '@/lib/icons'

export type RegisterPlanId = 'plan_1' | 'plan_3' | 'plan_10' | 'plan_personalizado'

export interface RegisterPlanDefinition {
  id: RegisterPlanId
  envKey?: string
  name: string
  label: string
  licenses: number
  supportsManager: boolean
  description: string
  highlights: readonly string[]
  priceLabel: string
  pricePeriod?: string
  icon: LucideIcon
  theme: PlanCardTheme
  /** Se true, redireciona para WhatsApp em vez do fluxo de cadastro/Stripe */
  whatsappRedirect?: boolean
}

export interface RegisterUserInput {
  name: string
  email: string
  username: string
  password: string
}

export interface RegisterFormValues {
  planId: RegisterPlanId
  isManager: boolean
  name: string
  email: string
  phone: string
  username: string
  password: string
  confirmPassword: string
  website: string
  /** Usuarios adicionais para planos de 3 ou 10 licencas (exclui o primeiro) */
  teamMembers: RegisterUserInput[]
}

export type RegisterFormField = keyof RegisterFormValues

export interface RegisterPayload {
  planId: RegisterPlanId
  isManager: boolean
  name: string
  email: string
  phone: string
  username: string
  password: string
  website: string
  turnstileToken: string
  /** Usar checkout Stripe embedded na página em vez de redirecionar */
  embedded?: boolean
  /** Para planos pacote: demais usuarios (sem o primeiro) */
  teamMembers?: RegisterUserInput[]
}

export interface RegisterResponse {
  email?: string
  requiresEmailConfirmation?: boolean
  success?: boolean
  userId?: string
  registerToken?: string
  checkoutUrl?: string
  /** Para checkout embedded: client_secret da sessão Stripe */
  clientSecret?: string
  error?: string
  /** Detalhe do erro (ex: mensagem do Supabase) */
  detail?: string
}
