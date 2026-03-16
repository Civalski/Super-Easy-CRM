import type {
  RegisterFormValues,
  RegisterPayload,
  RegisterUserInput,
} from '@/components/features/register/types'
import { REGISTER_COPY, REGISTER_PLANS } from '@/components/features/register/constants'

export function normalizeRegisterValues(values: RegisterFormValues) {
  return {
    ...values,
    email: values.email.trim().toLowerCase(),
    name: values.name.trim(),
    phone: values.phone.trim().replace(/\D/g, ''),
    username: values.username.trim().toLowerCase(),
    teamMembers: values.teamMembers.map((m) => ({
      email: m.email.trim().toLowerCase(),
      name: m.name.trim(),
      password: m.password,
      username: m.username.trim().toLowerCase(),
    })),
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Valida senha forte: maiúscula, minúscula, número e caractere especial */
export function isValidPassword(value: string): boolean {
  if (value.length < 8) return false
  if (!/[A-Z]/.test(value)) return false
  if (!/[a-z]/.test(value)) return false
  if (!/[0-9]/.test(value)) return false
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false
  return true
}

/** Formata celular como (00) 00000-0000 conforme o usuário digita */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits.length === 2 ? `(${digits}) ` : `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function validateUserInput(u: RegisterUserInput, index: number): string | null {
  if (!u.name || !u.email || !u.username || !u.password) {
    return `Membro ${index + 1}: preencha nome, email, usuário e senha`
  }
  if (!isValidEmail(u.email)) return `Membro ${index + 1}: email inválido`
  if (!isValidPassword(u.password)) return `Membro ${index + 1}: ${REGISTER_COPY.passwordComplexity}`
  return null
}

export function validateRegisterForm(values: RegisterFormValues) {
  const normalized = normalizeRegisterValues(values)

  if (
    !normalized.name ||
    !normalized.email ||
    !normalized.phone ||
    !normalized.username ||
    !normalized.password
  ) {
    return REGISTER_COPY.missingFields
  }

  if (!isValidEmail(normalized.email)) {
    return REGISTER_COPY.invalidEmail
  }

  if (normalized.phone.length < 10) {
    return REGISTER_COPY.invalidPhone
  }

  if (normalized.password.length < 8) {
    return REGISTER_COPY.passwordLength
  }
  if (!isValidPassword(normalized.password)) {
    return REGISTER_COPY.passwordComplexity
  }

  if (normalized.password !== normalized.confirmPassword) {
    return REGISTER_COPY.passwordMismatch
  }

  const plan = REGISTER_PLANS.find((p) => p.id === normalized.planId)
  const requiredMembers = plan ? plan.licenses - 1 : 0

  if (requiredMembers > 0) {
    if (normalized.teamMembers.length !== requiredMembers) {
      return REGISTER_COPY.allAccountsRequired
    }
    for (let i = 0; i < normalized.teamMembers.length; i++) {
      const err = validateUserInput(normalized.teamMembers[i], i)
      if (err) return err
    }
  }

  return null
}

export function toRegisterPayload(
  values: RegisterFormValues,
  turnstileToken: string
): RegisterPayload {
  const normalized = normalizeRegisterValues(values)
  const plan = REGISTER_PLANS.find((p) => p.id === normalized.planId)
  const hasTeamMembers = plan && plan.licenses > 1
  const isStripePlan = plan && !plan.whatsappRedirect

  return {
    email: normalized.email,
    embedded: isStripePlan,
    isManager: normalized.isManager,
    name: normalized.name,
    password: normalized.password,
    phone: normalized.phone,
    planId: normalized.planId,
    teamMembers: hasTeamMembers ? normalized.teamMembers : undefined,
    turnstileToken,
    username: normalized.username,
    website: normalized.website,
  }
}

export function resolveTurnstileToken(
  turnstileSiteKey: string,
  turnstileToken: string
) {
  if (!turnstileSiteKey) return ''
  if (turnstileToken) return turnstileToken

  const input = document.querySelector(
    'input[name="cf-turnstile-response"]'
  ) as HTMLInputElement | null

  return input?.value?.trim() ?? ''
}
