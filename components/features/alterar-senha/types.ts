export type PasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type PasswordFormMode = 'authenticated' | 'recovery'
