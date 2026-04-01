import { DEFAULT_WHATSAPP_SALES_PHONE } from './constants'
import type { PremiumPlanDefinition } from './types'

export function clampUserCount(value: number, minUsers: number) {
  if (!Number.isFinite(value)) return minUsers
  return Math.max(minUsers, Math.floor(value))
}

export function sanitizePhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 ? cleaned : '5519998205608'
}

export function buildWhatsAppQuoteUrl(plan: PremiumPlanDefinition, userCount: number) {
  const phone = sanitizePhoneNumber(DEFAULT_WHATSAPP_SALES_PHONE)
  const message = [
    'Ola, time Arker!',
    `Quero um orcamento para o ${plan.name}.`,
    `Quantidade estimada de usuarios: ${userCount}.`,
    `Contexto: ${plan.whatsappContext}.`,
    'Podem me enviar uma proposta comercial?',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
