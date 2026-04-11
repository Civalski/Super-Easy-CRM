import { redirect } from 'next/navigation'
import { getPostLoginPath } from '@/lib/crmEdition'

export default function Home() {
  redirect(getPostLoginPath())
}

