import type { LucideIcon } from '@/lib/icons'

export type PlanTier = 'solo' | 'team' | 'enterprise'

export type PlanActionType = 'stripe' | 'whatsapp'

export type PremiumPlanDefinition = {
  id: PlanTier
  name: string
  label: string
  description: string
  priceLabel: string
  priceHint: string
  actionLabel: string
  actionType: PlanActionType
  badge: string
  minUsers: number
  defaultUsers: number
  whatsappContext: string
  icon: LucideIcon
  highlights: string[]
}

export type PremiumBenefit = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

export type CrmCapability = {
  id: string
  title: string
  description: string
}
