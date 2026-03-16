import { render } from '@react-email/render'
import React from 'react'
import EmailRedefinirSenha from './EmailRedefinirSenha'

export type ResetPasswordEmailParams = {
  resetLink: string
  nome?: string
  logoUrl?: string
  siteUrl?: string
}

export async function buildResetPasswordEmailHtml(
  params: ResetPasswordEmailParams
): Promise<string> {
  return render(
    React.createElement(EmailRedefinirSenha, {
      resetLink: params.resetLink,
      nome: params.nome,
      logoUrl: params.logoUrl,
      siteUrl: params.siteUrl,
    })
  )
}
