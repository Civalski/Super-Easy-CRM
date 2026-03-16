import { MIN_PASSWORD_LENGTH, PASSWORD_ERROR_MESSAGES } from './constants'
import type { PasswordFormValues } from './types'

export function validatePasswordForm(
  values: PasswordFormValues,
  requireCurrentPassword: boolean
) {
  if (requireCurrentPassword && !values.currentPassword) {
    return PASSWORD_ERROR_MESSAGES.currentRequired
  }

  if (!values.newPassword) {
    return PASSWORD_ERROR_MESSAGES.newRequired
  }

  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_ERROR_MESSAGES.minLength
  }

  if (!values.confirmPassword) {
    return PASSWORD_ERROR_MESSAGES.confirmRequired
  }

  if (values.newPassword !== values.confirmPassword) {
    return PASSWORD_ERROR_MESSAGES.mismatch
  }

  if (requireCurrentPassword && values.currentPassword === values.newPassword) {
    return PASSWORD_ERROR_MESSAGES.sameAsCurrent
  }

  return null
}

export function validateResetEmail(email: string) {
  const trimmedEmail = email.trim().toLowerCase()

  if (!trimmedEmail) {
    return {
      email: trimmedEmail,
      error: PASSWORD_ERROR_MESSAGES.emailRequired,
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return {
      email: trimmedEmail,
      error: PASSWORD_ERROR_MESSAGES.emailInvalid,
    }
  }

  return {
    email: trimmedEmail,
    error: null,
  }
}
