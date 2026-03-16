type BuildResetPasswordLinkParams = {
  redirectTo: string
  tokenHash: string
  type: string
}

export function buildResetPasswordLink(params: BuildResetPasswordLinkParams) {
  const redirectUrl = new URL(params.redirectTo)
  redirectUrl.searchParams.set('token_hash', params.tokenHash)
  redirectUrl.searchParams.set('type', params.type)
  return redirectUrl.toString()
}
