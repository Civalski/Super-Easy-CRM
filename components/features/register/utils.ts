import type {
  RegisterFormValues,
  RegisterPayload,
} from '@/components/features/register/types'
import { REGISTER_COPY } from '@/components/features/register/constants'

export function normalizeRegisterValues(values: RegisterFormValues) {
  return {
    ...values,
    code: values.code.trim(),
    email: values.email.trim().toLowerCase(),
    name: values.name.trim(),
    username: values.username.trim().toLowerCase(),
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateRegisterForm(values: RegisterFormValues) {
  const normalized = normalizeRegisterValues(values)

  if (
    !normalized.name ||
    !normalized.email ||
    !normalized.username ||
    !normalized.password ||
    !normalized.code
  ) {
    return REGISTER_COPY.missingFields
  }

  if (!isValidEmail(normalized.email)) {
    return REGISTER_COPY.invalidEmail
  }

  if (normalized.password.length < 8) {
    return REGISTER_COPY.passwordLength
  }

  if (normalized.password !== normalized.confirmPassword) {
    return REGISTER_COPY.passwordMismatch
  }

  return null
}

export function toRegisterPayload(
  values: RegisterFormValues,
  turnstileToken: string
): RegisterPayload {
  const normalized = normalizeRegisterValues(values)
  return {
    code: normalized.code,
    email: normalized.email,
    name: normalized.name,
    password: normalized.password,
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
