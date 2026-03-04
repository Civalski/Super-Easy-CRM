import type { RegisterFormValues } from '@/components/features/register/types'

export const INITIAL_REGISTER_FORM: RegisterFormValues = {
  code: '',
  confirmPassword: '',
  email: '',
  name: '',
  password: '',
  username: '',
  website: '',
}

export const REGISTER_COPY = {
  antiBotError: 'Falha na verificacao anti-bot',
  creatingAccount: 'Criando conta...',
  defaultError: 'Erro ao registrar usuario',
  invalidEmail: 'Email invalido',
  loadingAntiBot: 'Carregando verificacao anti-bot...',
  missingFields: 'Preencha nome, email, usuario, senha e codigo',
  passwordLength: 'A senha deve ter pelo menos 8 caracteres',
  passwordMismatch: 'As senhas nao conferem',
  submitLabel: 'Criar conta',
  turnstileRequired: 'Confirme a verificacao anti-bot para continuar',
}
