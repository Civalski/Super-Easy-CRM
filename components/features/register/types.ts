export interface RegisterFormValues {
  name: string
  email: string
  username: string
  password: string
  confirmPassword: string
  code: string
  website: string
}

export type RegisterFormField = keyof RegisterFormValues

export interface RegisterPayload {
  name: string
  email: string
  username: string
  password: string
  code: string
  website: string
  turnstileToken: string
}

export interface RegisterResponse {
  success?: boolean
  userId?: string
  error?: string
}
