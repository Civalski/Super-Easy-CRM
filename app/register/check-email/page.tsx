import { redirect } from 'next/navigation'

type RegisterCheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function RegisterCheckEmailPage({
  searchParams,
}: RegisterCheckEmailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const email = readParam(resolvedSearchParams, 'email')
  const status = readParam(resolvedSearchParams, 'status')
  const destination = new URLSearchParams()

  if (email) {
    destination.set('email', email)
  }

  if (status === 'error') {
    destination.set('confirmation', 'required')
  } else {
    destination.set('confirmation', 'pending')
  }

  redirect(`/login?${destination.toString()}`)
}
