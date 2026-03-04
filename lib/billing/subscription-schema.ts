export function isSubscriptionSchemaMissingError(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('column') && message.includes('does not exist')
}
