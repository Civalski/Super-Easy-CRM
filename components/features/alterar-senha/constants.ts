export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_ERROR_MESSAGES = {
  currentRequired: 'Informe sua senha atual',
  emailRequired: 'Informe seu email',
  emailInvalid: 'Email invalido',
  newRequired: 'Informe a nova senha',
  confirmRequired: 'Confirme a nova senha',
  minLength: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
  mismatch: 'As senhas nao conferem',
  sameAsCurrent: 'A nova senha deve ser diferente da senha atual',
} as const
