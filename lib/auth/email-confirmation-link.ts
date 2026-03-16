type BuildEmailConfirmationLinkParams = {
  redirectTo: string
  tokenHash: string
  type: string
}

export function buildEmailConfirmationLink(params: BuildEmailConfirmationLinkParams) {
  const redirectUrl = new URL(params.redirectTo)
  redirectUrl.searchParams.set('token_hash', params.tokenHash)
  redirectUrl.searchParams.set('type', params.type)
  return redirectUrl.toString()
}
