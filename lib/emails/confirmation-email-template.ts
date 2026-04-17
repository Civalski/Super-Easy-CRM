import { render } from '@react-email/render'
import React from 'react'
import EmailConfirmacaoCliente from './EmailConfirmacaoCliente'
import { resolveEmailLogoUrl } from './resolve-email-logo-url'

export type ConfirmationEmailParams = {
  confirmationLink: string
  nome?: string
  logoUrl?: string
  siteUrl?: string
}

export async function buildConfirmationEmailHtml(
  params: ConfirmationEmailParams
): Promise<string> {
  return render(
    React.createElement(EmailConfirmacaoCliente, {
      confirmationLink: params.confirmationLink,
      nome: params.nome,
      logoUrl: params.logoUrl ?? resolveEmailLogoUrl(),
      siteUrl: params.siteUrl,
    })
  )
}
